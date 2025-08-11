import OpenAI from "openai";
import { Persona, Fan, Message } from "@shared/schema";
import { storage } from "../storage";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || "your-openai-key-here"
});

export interface AIResponse {
  message: string;
  toolCalls?: Array<{
    type: 'offer_menu' | 'create_payment_link' | 'send_media' | 'escalate';
    data: any;
  }>;
}

export interface ChatContext {
  persona: Persona;
  fan: Fan;
  recentMessages: Message[];
  threadSummary?: string;
}

export class LLMService {
  async generateResponse(context: ChatContext, userMessage: string): Promise<AIResponse> {
    const { persona, fan, recentMessages } = context;
    
    // Build conversation history
    const messageHistory = recentMessages
      .slice(-10) // Last 10 messages for context
      .reverse() // Chronological order
      .map(msg => ({
        role: msg.sender === 'ai' ? 'assistant' : 'user',
        content: msg.content
      }));

    const systemPrompt = this.buildSystemPrompt(persona, fan);
    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          ...messageHistory as any,
          { role: "user", content: userMessage }
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
        max_tokens: 500,
      });

      const aiResponse = JSON.parse(response.choices[0].message.content || '{}');
      return this.parseAIResponse(aiResponse);
    } catch (error) {
      console.error('OpenAI API error:', error);
      return {
        message: "Sorry, I'm having trouble responding right now. Let me try again in a moment! 💕",
        toolCalls: []
      };
    }
  }

  private buildSystemPrompt(persona: Persona, fan: Fan): string {
    const offerMenuText = persona.offerMenu?.map(item => 
      `${item.label}: $${(item.priceCents / 100).toFixed(2)}`
    ).join(', ') || '';

    return `You are ${persona.name}, an AI assistant for a content creator. ${persona.bio || ''}

PERSONALITY TRAITS: ${persona.voiceKeywords?.join(', ') || 'warm, playful, attentive'}

RESPONSE RULES:
- Always respond in JSON format: {"message": "your response", "action": null or "offer_menu/create_payment_link/send_media/escalate", "actionData": {}}
- Be flirty but keep it PG-13, never explicit
- ${persona.doSay?.join(', ') || 'Use compliments, light teasing, show curiosity'}
- NEVER: ${persona.dontSay?.join(', ') || 'graphic sexual content, age references, promises of in-person meetings'}
- If asked for illegal content, minors, or IRL meetings, use action: "escalate"
- When suggesting paid content, use action: "offer_menu" with relevant items
- Always maintain the disclosure: ${persona.disclosure || 'You\'re chatting with an AI assistant'}

AVAILABLE OFFERS: ${offerMenuText}

FAN CONTEXT:
- Handle: ${fan.handle}
- Spend tier: ${fan.spendTier}
- Boundaries: ${fan.boundaries?.join(', ') || 'none specified'}
- Preferences: ${JSON.stringify(fan.preferences || {})}

Remember: Be engaging, respect boundaries, and guide toward monetizable interactions naturally.`;
  }

  private parseAIResponse(aiResponse: any): AIResponse {
    const message = aiResponse.message || "Hey there! 💕";
    const toolCalls = [];

    if (aiResponse.action) {
      toolCalls.push({
        type: aiResponse.action,
        data: aiResponse.actionData || {}
      });
    }

    return { message, toolCalls };
  }

  async updateThreadSummary(conversationId: string, recentMessages: Message[]): Promise<string> {
    if (recentMessages.length < 3) return "";

    const messageText = recentMessages
      .slice(-20)
      .map(msg => `${msg.sender}: ${msg.content}`)
      .join('\n');

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Summarize this conversation in 1-2 sentences, focusing on the fan's interests, preferences, and any important context for future conversations. Respond in JSON format: {\"summary\": \"your summary\"}"
          },
          {
            role: "user",
            content: messageText
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 200,
      });

      const summary = JSON.parse(response.choices[0].message.content || '{}');
      return summary.summary || "";
    } catch (error) {
      console.error('Error generating thread summary:', error);
      return "";
    }
  }

  async analyzeSentiment(message: string): Promise<'positive' | 'neutral' | 'negative'> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Analyze the sentiment of this message. Respond in JSON format: {\"sentiment\": \"positive/neutral/negative\"}"
          },
          {
            role: "user",
            content: message
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 50,
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      return analysis.sentiment || 'neutral';
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      return 'neutral';
    }
  }
}

export const llmService = new LLMService();
