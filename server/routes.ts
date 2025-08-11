import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { z } from "zod";
import { storage } from "./storage";
import { llmService } from "./services/llm";
import { moderationService } from "./services/moderation";
import { mediaService } from "./services/media";
import { auditService } from "./services/audit";
import { insertPersonaSchema, insertFanSchema, insertContentItemSchema, insertMessageSchema } from "@shared/schema";

// Initialize Stripe only if keys are available
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-06-20",
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Health check
  app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // =============
  // PERSONA MANAGEMENT
  // =============

  app.post("/api/personas", async (req, res) => {
    try {
      const personaData = insertPersonaSchema.parse(req.body);
      const persona = await storage.createPersona(personaData);
      
      await auditService.logPersonaUpdate(persona.id, personaData.creatorId, { action: 'created' });
      
      res.json(persona);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/personas/:id", async (req, res) => {
    try {
      const persona = await storage.getPersona(req.params.id);
      if (!persona) {
        return res.status(404).json({ message: "Persona not found" });
      }
      res.json(persona);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/personas/:id", async (req, res) => {
    try {
      const updates = insertPersonaSchema.partial().parse(req.body);
      const persona = await storage.updatePersona(req.params.id, updates);
      
      await auditService.logPersonaUpdate(persona.id, persona.creatorId, { action: 'updated', changes: updates });
      
      res.json(persona);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/personas/creator/:creatorId", async (req, res) => {
    try {
      const persona = await storage.getPersonaByCreatorId(req.params.creatorId);
      if (!persona) {
        return res.status(404).json({ message: "Persona not found for creator" });
      }
      res.json(persona);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // =============
  // AI CONVERSATION
  // =============

  app.post("/api/ai/reply", async (req, res) => {
    try {
      const { fanId, personaId, message } = z.object({
        fanId: z.string(),
        personaId: z.string(),
        message: z.string(),
      }).parse(req.body);

      // Moderation check
      const moderationResult = await moderationService.moderateMessage(message, fanId);
      
      if (moderationResult.action === 'block') {
        await auditService.logModerationAction('', 'block', moderationResult.reason || '', moderationResult.severity);
        return res.status(400).json({ 
          message: "Message blocked by moderation system",
          reason: moderationResult.reason 
        });
      }

      if (moderationResult.action === 'escalate') {
        await moderationService.escalateMessage(message, moderationResult.reason || '', fanId);
        return res.status(400).json({ 
          message: "Message flagged for review",
          reason: "Content requires human review" 
        });
      }

      // Check for stop words
      if (await moderationService.checkStopWords(message)) {
        await moderationService.processStopRequest(fanId);
        return res.json({
          message: "I understand you'd like to stop our conversations. You've been unsubscribed. Take care! 💕",
          action: 'stop_processed'
        });
      }

      // Get context for AI response
      const [persona, fan] = await Promise.all([
        storage.getPersona(personaId),
        storage.getFan(fanId)
      ]);

      if (!persona || !fan) {
        return res.status(404).json({ message: "Persona or fan not found" });
      }

      // Check consent gate for romantic content
      if (!await moderationService.checkConsentGate(fanId)) {
        return res.json({
          message: "Before we chat, I need to confirm you're 18+ and okay with receiving romantic messages. Are you over 18 and interested in flirty conversation? 💕",
          action: 'consent_required'
        });
      }

      // Get or create conversation
      let conversation = await storage.getConversationByFanAndPersona(fanId, personaId);
      if (!conversation) {
        conversation = await storage.createConversation({
          fanId,
          personaId,
          threadSummary: "",
          sentiment: "neutral",
          lastMessageAt: new Date(),
        });
      }

      // Get recent message history
      const recentMessages = await storage.getConversationMessages(conversation.id, 10);

      // Generate AI response
      const aiResponse = await llmService.generateResponse({
        persona,
        fan,
        recentMessages,
        threadSummary: conversation.threadSummary || undefined,
      }, message);

      // Store the fan's message
      await storage.createMessage({
        conversationId: conversation.id,
        type: 'text',
        content: message,
        sender: 'fan',
        sentAt: new Date(),
      });

      // Store the AI's response
      const aiMessage = await storage.createMessage({
        conversationId: conversation.id,
        type: 'text',
        content: aiResponse.message,
        sender: 'ai',
        sentAt: new Date(),
      });

      // Update conversation
      const sentiment = await llmService.analyzeSentiment(message);
      await storage.updateConversation(conversation.id, {
        lastMessageAt: new Date(),
        sentiment,
      });

      // Log the interaction
      await auditService.logConversation(conversation.id, aiMessage.id, aiResponse.message, message, moderationResult);

      // Process tool calls
      const processedActions = await Promise.all(
        (aiResponse.toolCalls || []).map(async (toolCall) => {
          switch (toolCall.type) {
            case 'offer_menu':
              return await this.processOfferMenu(toolCall.data, persona, fan);
            case 'create_payment_link':
              return await this.createPaymentLink(toolCall.data, fan.id, persona.creatorId);
            case 'send_media':
              return await this.sendMediaContent(toolCall.data, fan.id);
            default:
              return null;
          }
        })
      );

      res.json({
        message: aiResponse.message,
        actions: processedActions.filter(Boolean),
        conversationId: conversation.id,
        messageId: aiMessage.id,
      });

    } catch (error: any) {
      console.error('Error in AI reply:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Helper method for processing offer menu
  async function processOfferMenu(data: any, persona: any, fan: any) {
    const offers = persona.offerMenu || [];
    const relevantOffers = offers.filter((offer: any) => 
      !data.filterBy || offer.sku.includes(data.filterBy)
    );
    
    return {
      type: 'offer_menu',
      offers: relevantOffers.map((offer: any) => ({
        ...offer,
        formattedPrice: `$${(offer.priceCents / 100).toFixed(2)}`
      }))
    };
  }

  // Helper method for creating payment links
  async function createPaymentLink(data: any, fanId: string, creatorId: string) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: data.amountCents || 2500,
        currency: 'usd',
        metadata: {
          fanId,
          creatorId,
          productType: data.productType || 'custom_content',
        },
      });

      // Store payment record
      await storage.createPayment({
        fanId,
        creatorId,
        stripePaymentIntentId: paymentIntent.id,
        amountCents: data.amountCents || 2500,
        status: 'pending',
        productType: data.productType || 'custom_content',
        metadata: data,
      });

      return {
        type: 'payment_link',
        clientSecret: paymentIntent.client_secret,
        amount: data.amountCents || 2500,
        description: data.description || 'Custom content',
      };
    } catch (error) {
      console.error('Error creating payment link:', error);
      return null;
    }
  }

  // Helper method for sending media content
  async function sendMediaContent(data: any, fanId: string) {
    try {
      const contentId = data.contentId;
      if (!contentId) return null;

      const signedUrl = await mediaService.getSignedUrl(contentId, {
        trackDelivery: true,
        fanId,
      });

      if (!signedUrl) return null;

      await auditService.logContentAccess(contentId, fanId, 'view');

      return {
        type: 'media_content',
        url: signedUrl,
        contentId,
      };
    } catch (error) {
      console.error('Error sending media content:', error);
      return null;
    }
  }

  // =============
  // CONSENT MANAGEMENT
  // =============

  app.post("/api/consent/affirm", async (req, res) => {
    try {
      const { fanId, affirmations } = z.object({
        fanId: z.string(),
        affirmations: z.array(z.string()),
      }).parse(req.body);

      const consentStatus = {
        ageAffirmed: affirmations.includes("I am 18+"),
        romanticContent: affirmations.includes("I consent to romantic messages"),
        timestamp: new Date().toISOString(),
      };

      await storage.updateFan(fanId, { consentStatus });
      
      await auditService.logFanInteraction(fanId, 'consent_affirmed', { affirmations });

      res.json({ success: true, consentStatus });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // =============
  // CONTENT MANAGEMENT
  // =============

  app.get("/api/content/creator/:creatorId", async (req, res) => {
    try {
      const content = await storage.getContentItemsByCreator(req.params.creatorId);
      res.json(content);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/content", async (req, res) => {
    try {
      const contentData = insertContentItemSchema.parse(req.body);
      const content = await storage.createContentItem(contentData);
      res.json(content);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/content/top/:creatorId", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const content = await storage.getTopPerformingContent(req.params.creatorId, limit);
      res.json(content);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // =============
  // FAN MANAGEMENT
  // =============

  app.post("/api/fans", async (req, res) => {
    try {
      const fanData = insertFanSchema.parse(req.body);
      const fan = await storage.createFan(fanData);
      res.json(fan);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/fans/:id", async (req, res) => {
    try {
      const fan = await storage.getFan(req.params.id);
      if (!fan) {
        return res.status(404).json({ message: "Fan not found" });
      }
      res.json(fan);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/fans/:id", async (req, res) => {
    try {
      const updates = insertFanSchema.partial().parse(req.body);
      const fan = await storage.updateFan(req.params.id, updates);
      res.json(fan);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // =============
  // ANALYTICS & DASHBOARD
  // =============

  app.get("/api/dashboard/metrics/:creatorId", async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics(req.params.creatorId);
      res.json(metrics);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/analytics/revenue/:creatorId", async (req, res) => {
    try {
      const revenue = await storage.getRevenueByCreator(req.params.creatorId);
      res.json(revenue);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/analytics/safety", async (req, res) => {
    try {
      const complianceScore = await moderationService.getComplianceScore();
      const queue = await storage.getModerationQueue('pending');
      
      res.json({
        complianceScore,
        pendingReviews: queue.length,
        totalModerated: (await storage.getModerationQueue()).length,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // =============
  // CONVERSATIONS & MESSAGES
  // =============

  app.get("/api/conversations/active/:personaId", async (req, res) => {
    try {
      const conversations = await storage.getActiveConversations(req.params.personaId);
      
      // Get fan details for each conversation
      const conversationsWithFans = await Promise.all(
        conversations.map(async (conv) => {
          const fan = await storage.getFan(conv.fanId);
          return { ...conv, fan };
        })
      );
      
      res.json(conversationsWithFans);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/messages/:conversationId", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const messages = await storage.getConversationMessages(req.params.conversationId, limit);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // =============
  // PAYMENTS (STRIPE)
  // =============

  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { amountCents, fanId, creatorId, productType, metadata } = req.body;
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: "usd",
        metadata: { fanId, creatorId, productType, ...metadata },
      });

      // Store payment record
      await storage.createPayment({
        fanId,
        creatorId,
        stripePaymentIntentId: paymentIntent.id,
        amountCents,
        status: 'pending',
        productType,
        metadata,
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Stripe webhook handler
  app.post("/api/webhooks/stripe", async (req, res) => {
    try {
      const sig = req.headers['stripe-signature'] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      
      if (!webhookSecret) {
        throw new Error('Missing STRIPE_WEBHOOK_SECRET');
      }

      const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          await handlePaymentSuccess(paymentIntent);
          break;
        
        case 'payment_intent.payment_failed':
          const failedPayment = event.data.object as Stripe.PaymentIntent;
          await handlePaymentFailed(failedPayment);
          break;
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error('Stripe webhook error:', error);
      res.status(400).json({ message: error.message });
    }
  });

  async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    try {
      // Find the payment record
      const payments = await storage.getAuditLogs('payment', paymentIntent.id);
      if (payments.length === 0) return;

      // Update payment status
      // Note: In a real implementation, you'd need to find the payment by stripe_payment_intent_id
      // For now, we'll log the success
      await auditService.logPayment(
        paymentIntent.id,
        paymentIntent.metadata.fanId || '',
        paymentIntent.amount,
        paymentIntent.metadata.productType || 'unknown',
        'completed'
      );

      // TODO: Trigger content delivery, send thank you message, etc.
    } catch (error) {
      console.error('Error handling payment success:', error);
    }
  }

  async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    try {
      await auditService.logPayment(
        paymentIntent.id,
        paymentIntent.metadata.fanId || '',
        paymentIntent.amount,
        paymentIntent.metadata.productType || 'unknown',
        'failed'
      );
    } catch (error) {
      console.error('Error handling payment failure:', error);
    }
  }

  // =============
  // MODERATION
  // =============

  app.get("/api/moderation/queue", async (req, res) => {
    try {
      const status = req.query.status as string;
      const queue = await storage.getModerationQueue(status);
      res.json(queue);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/moderation/queue/:id", async (req, res) => {
    try {
      const { status, reviewedBy } = req.body;
      const item = await storage.updateModerationQueue(req.params.id, {
        status,
        reviewedBy,
        reviewedAt: new Date(),
      });
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
