import { 
  users, personas, fans, conversations, messages, contentItems, 
  payments, auditLogs, moderationQueue,
  type User, type InsertUser, type Persona, type InsertPersona,
  type Fan, type InsertFan, type Conversation, type InsertConversation,
  type Message, type InsertMessage, type ContentItem, type InsertContentItem,
  type Payment, type InsertPayment, type AuditLog, type InsertAuditLog,
  type ModerationQueue, type InsertModerationQueue
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStripeInfo(id: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User>;

  // Personas
  getPersona(id: string): Promise<Persona | undefined>;
  getPersonaByCreatorId(creatorId: string): Promise<Persona | undefined>;
  createPersona(persona: InsertPersona): Promise<Persona>;
  updatePersona(id: string, updates: Partial<InsertPersona>): Promise<Persona>;
  
  // Fans
  getFan(id: string): Promise<Fan | undefined>;
  getFanByXUserId(xUserId: string): Promise<Fan | undefined>;
  createFan(fan: InsertFan): Promise<Fan>;
  updateFan(id: string, updates: Partial<InsertFan>): Promise<Fan>;
  getFansBySpendTier(tier: string): Promise<Fan[]>;
  
  // Conversations
  getConversation(id: string): Promise<Conversation | undefined>;
  getConversationByFanAndPersona(fanId: string, personaId: string): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: string, updates: Partial<InsertConversation>): Promise<Conversation>;
  getActiveConversations(personaId: string): Promise<Conversation[]>;
  
  // Messages
  getMessage(id: string): Promise<Message | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  getConversationMessages(conversationId: string, limit?: number): Promise<Message[]>;
  getScheduledMessages(): Promise<Message[]>;
  updateMessage(id: string, updates: Partial<InsertMessage>): Promise<Message>;
  
  // Content Items
  getContentItem(id: string): Promise<ContentItem | undefined>;
  createContentItem(item: InsertContentItem): Promise<ContentItem>;
  updateContentItem(id: string, updates: Partial<InsertContentItem>): Promise<ContentItem>;
  getContentItemsByCreator(creatorId: string): Promise<ContentItem[]>;
  getTopPerformingContent(creatorId: string, limit?: number): Promise<ContentItem[]>;
  
  // Payments
  getPayment(id: string): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, updates: Partial<InsertPayment>): Promise<Payment>;
  getPaymentsByFan(fanId: string): Promise<Payment[]>;
  getRevenueByCreator(creatorId: string): Promise<{ totalRevenue: number; paymentCount: number }>;
  
  // Audit Logs
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(entityType?: string, entityId?: string): Promise<AuditLog[]>;
  
  // Moderation
  createModerationQueue(item: InsertModerationQueue): Promise<ModerationQueue>;
  getModerationQueue(status?: string): Promise<ModerationQueue[]>;
  updateModerationQueue(id: string, updates: Partial<InsertModerationQueue>): Promise<ModerationQueue>;
  
  // Analytics
  getDashboardMetrics(creatorId: string): Promise<{
    totalRevenue: number;
    activeConversations: number;
    conversionRate: number;
    safetyScore: number;
    messagesSentToday: number;
    moderatedToday: number;
    blockedToday: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserStripeInfo(id: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ stripeCustomerId, stripeSubscriptionId })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getPersona(id: string): Promise<Persona | undefined> {
    const [persona] = await db.select().from(personas).where(eq(personas.id, id));
    return persona || undefined;
  }

  async getPersonaByCreatorId(creatorId: string): Promise<Persona | undefined> {
    const [persona] = await db
      .select()
      .from(personas)
      .where(and(eq(personas.creatorId, creatorId), eq(personas.isActive, true)));
    return persona || undefined;
  }

  async createPersona(persona: InsertPersona): Promise<Persona> {
    const [created] = await db.insert(personas).values(persona).returning();
    return created;
  }

  async updatePersona(id: string, updates: Partial<InsertPersona>): Promise<Persona> {
    const [updated] = await db
      .update(personas)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(personas.id, id))
      .returning();
    return updated;
  }

  async getFan(id: string): Promise<Fan | undefined> {
    const [fan] = await db.select().from(fans).where(eq(fans.id, id));
    return fan || undefined;
  }

  async getFanByXUserId(xUserId: string): Promise<Fan | undefined> {
    const [fan] = await db.select().from(fans).where(eq(fans.xUserId, xUserId));
    return fan || undefined;
  }

  async createFan(fan: InsertFan): Promise<Fan> {
    const [created] = await db.insert(fans).values(fan).returning();
    return created;
  }

  async updateFan(id: string, updates: Partial<InsertFan>): Promise<Fan> {
    const [updated] = await db
      .update(fans)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(fans.id, id))
      .returning();
    return updated;
  }

  async getFansBySpendTier(tier: string): Promise<Fan[]> {
    return await db.select().from(fans).where(eq(fans.spendTier, tier));
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation || undefined;
  }

  async getConversationByFanAndPersona(fanId: string, personaId: string): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(and(
        eq(conversations.fanId, fanId),
        eq(conversations.personaId, personaId),
        eq(conversations.isActive, true)
      ));
    return conversation || undefined;
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [created] = await db.insert(conversations).values(conversation).returning();
    return created;
  }

  async updateConversation(id: string, updates: Partial<InsertConversation>): Promise<Conversation> {
    const [updated] = await db
      .update(conversations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(conversations.id, id))
      .returning();
    return updated;
  }

  async getActiveConversations(personaId: string): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.personaId, personaId), eq(conversations.isActive, true)))
      .orderBy(desc(conversations.lastMessageAt));
  }

  async getMessage(id: string): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message || undefined;
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [created] = await db.insert(messages).values(message).returning();
    return created;
  }

  async getConversationMessages(conversationId: string, limit = 50): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(limit);
  }

  async getScheduledMessages(): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(and(
        sql`${messages.scheduledAt} IS NOT NULL`,
        sql`${messages.sentAt} IS NULL`,
        sql`${messages.scheduledAt} <= NOW()`
      ));
  }

  async updateMessage(id: string, updates: Partial<InsertMessage>): Promise<Message> {
    const [updated] = await db
      .update(messages)
      .set(updates)
      .where(eq(messages.id, id))
      .returning();
    return updated;
  }

  async getContentItem(id: string): Promise<ContentItem | undefined> {
    const [item] = await db.select().from(contentItems).where(eq(contentItems.id, id));
    return item || undefined;
  }

  async createContentItem(item: InsertContentItem): Promise<ContentItem> {
    const [created] = await db.insert(contentItems).values(item).returning();
    return created;
  }

  async updateContentItem(id: string, updates: Partial<InsertContentItem>): Promise<ContentItem> {
    const [updated] = await db
      .update(contentItems)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(contentItems.id, id))
      .returning();
    return updated;
  }

  async getContentItemsByCreator(creatorId: string): Promise<ContentItem[]> {
    return await db
      .select()
      .from(contentItems)
      .where(and(eq(contentItems.creatorId, creatorId), eq(contentItems.isActive, true)))
      .orderBy(desc(contentItems.createdAt));
  }

  async getTopPerformingContent(creatorId: string, limit = 10): Promise<ContentItem[]> {
    return await db
      .select()
      .from(contentItems)
      .where(and(eq(contentItems.creatorId, creatorId), eq(contentItems.isActive, true)))
      .orderBy(desc(contentItems.revenue))
      .limit(limit);
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment || undefined;
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [created] = await db.insert(payments).values(payment).returning();
    return created;
  }

  async updatePayment(id: string, updates: Partial<InsertPayment>): Promise<Payment> {
    const [updated] = await db
      .update(payments)
      .set(updates)
      .where(eq(payments.id, id))
      .returning();
    return updated;
  }

  async getPaymentsByFan(fanId: string): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.fanId, fanId))
      .orderBy(desc(payments.createdAt));
  }

  async getRevenueByCreator(creatorId: string): Promise<{ totalRevenue: number; paymentCount: number }> {
    const [result] = await db
      .select({
        totalRevenue: sql<number>`COALESCE(SUM(${payments.amountCents}), 0)::int`,
        paymentCount: count(payments.id)
      })
      .from(payments)
      .where(and(eq(payments.creatorId, creatorId), eq(payments.status, 'completed')));
    
    return {
      totalRevenue: result?.totalRevenue || 0,
      paymentCount: result?.paymentCount || 0
    };
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [created] = await db.insert(auditLogs).values(log).returning();
    return created;
  }

  async getAuditLogs(entityType?: string, entityId?: string): Promise<AuditLog[]> {
    let query = db.select().from(auditLogs);
    
    if (entityType && entityId) {
      query = query.where(and(eq(auditLogs.entityType, entityType), eq(auditLogs.entityId, entityId)));
    } else if (entityType) {
      query = query.where(eq(auditLogs.entityType, entityType));
    }
    
    return await query.orderBy(desc(auditLogs.createdAt));
  }

  async createModerationQueue(item: InsertModerationQueue): Promise<ModerationQueue> {
    const [created] = await db.insert(moderationQueue).values(item).returning();
    return created;
  }

  async getModerationQueue(status?: string): Promise<ModerationQueue[]> {
    let query = db.select().from(moderationQueue);
    
    if (status) {
      query = query.where(eq(moderationQueue.status, status));
    }
    
    return await query.orderBy(desc(moderationQueue.createdAt));
  }

  async updateModerationQueue(id: string, updates: Partial<InsertModerationQueue>): Promise<ModerationQueue> {
    const [updated] = await db
      .update(moderationQueue)
      .set(updates)
      .where(eq(moderationQueue.id, id))
      .returning();
    return updated;
  }

  async getDashboardMetrics(creatorId: string): Promise<{
    totalRevenue: number;
    activeConversations: number;
    conversionRate: number;
    safetyScore: number;
    messagesSentToday: number;
    moderatedToday: number;
    blockedToday: number;
  }> {
    // Get revenue data
    const { totalRevenue } = await this.getRevenueByCreator(creatorId);

    // Get active conversations count
    const persona = await this.getPersonaByCreatorId(creatorId);
    const activeConversations = persona ? (await this.getActiveConversations(persona.id)).length : 0;

    // Get today's message stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [messageStats] = await db
      .select({
        messagesSentToday: count(messages.id)
      })
      .from(messages)
      .innerJoin(conversations, eq(messages.conversationId, conversations.id))
      .innerJoin(personas, eq(conversations.personaId, personas.id))
      .where(and(
        eq(personas.creatorId, creatorId),
        sql`${messages.createdAt} >= ${today}`
      ));

    const [moderationStats] = await db
      .select({
        moderatedToday: count(moderationQueue.id),
        blockedToday: sql<number>`SUM(CASE WHEN ${moderationQueue.status} = 'blocked' THEN 1 ELSE 0 END)::int`
      })
      .from(moderationQueue)
      .where(sql`${moderationQueue.createdAt} >= ${today}`);

    return {
      totalRevenue: totalRevenue / 100, // Convert cents to dollars
      activeConversations,
      conversionRate: 18.5, // Placeholder - would calculate based on actual conversion metrics
      safetyScore: 98.2, // Placeholder - would calculate based on moderation metrics
      messagesSentToday: messageStats?.messagesSentToday || 0,
      moderatedToday: moderationStats?.moderatedToday || 0,
      blockedToday: moderationStats?.blockedToday || 0,
    };
  }
}

export const storage = new DatabaseStorage();
