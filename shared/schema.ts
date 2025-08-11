import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const personas = pgTable("personas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  bio: text("bio"),
  voiceKeywords: jsonb("voice_keywords").$type<string[]>(),
  doSay: jsonb("do_say").$type<string[]>(),
  dontSay: jsonb("dont_say").$type<string[]>(),
  offerMenu: jsonb("offer_menu").$type<Array<{sku: string, label: string, priceCents: number}>>(),
  disclosure: text("disclosure"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const fans = pgTable("fans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  xUserId: text("x_user_id").notNull().unique(),
  handle: text("handle").notNull(),
  displayName: text("display_name"),
  timezone: text("timezone"),
  preferences: jsonb("preferences").$type<Record<string, any>>(),
  spendTier: text("spend_tier").default("free"),
  lastPurchaseAt: timestamp("last_purchase_at"),
  boundaries: jsonb("boundaries").$type<string[]>(),
  consentStatus: jsonb("consent_status").$type<{ageAffirmed: boolean, romanticContent: boolean, timestamp: string}>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fanId: varchar("fan_id").notNull().references(() => fans.id),
  personaId: varchar("persona_id").notNull().references(() => personas.id),
  threadSummary: text("thread_summary"),
  sentiment: text("sentiment"),
  lastMessageAt: timestamp("last_message_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id),
  type: text("type").notNull(), // 'text', 'media', 'payment_link'
  content: text("content").notNull(),
  sender: text("sender").notNull(), // 'ai', 'fan'
  moderationStatus: text("moderation_status").default("approved"),
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const contentItems = pgTable("content_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").notNull().references(() => users.id),
  type: text("type").notNull(), // 'image', 'video', 'audio'
  title: text("title").notNull(),
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  captionTemplate: text("caption_template"),
  allowedContexts: jsonb("allowed_contexts").$type<string[]>(),
  priceCents: integer("price_cents").default(0),
  purchaseCount: integer("purchase_count").default(0),
  revenue: decimal("revenue", { precision: 10, scale: 2 }).default("0"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fanId: varchar("fan_id").notNull().references(() => fans.id),
  creatorId: varchar("creator_id").notNull().references(() => users.id),
  stripePaymentIntentId: text("stripe_payment_intent_id").notNull(),
  amountCents: integer("amount_cents").notNull(),
  status: text("status").notNull(), // 'pending', 'completed', 'failed'
  productType: text("product_type").notNull(), // 'custom_video', 'chat_session', 'photo_set'
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  userId: varchar("user_id").references(() => users.id),
  fanId: varchar("fan_id").references(() => fans.id),
  details: jsonb("details").$type<Record<string, any>>(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const moderationQueue = pgTable("moderation_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: varchar("message_id").references(() => messages.id),
  content: text("content").notNull(),
  flagReason: text("flag_reason").notNull(),
  severity: text("severity").notNull(), // 'low', 'medium', 'high', 'critical'
  status: text("status").default("pending"), // 'pending', 'approved', 'blocked'
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  personas: many(personas),
  contentItems: many(contentItems),
  payments: many(payments),
}));

export const personasRelations = relations(personas, ({ one, many }) => ({
  creator: one(users, {
    fields: [personas.creatorId],
    references: [users.id],
  }),
  conversations: many(conversations),
}));

export const fansRelations = relations(fans, ({ many }) => ({
  conversations: many(conversations),
  payments: many(payments),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  fan: one(fans, {
    fields: [conversations.fanId],
    references: [fans.id],
  }),
  persona: one(personas, {
    fields: [conversations.personaId],
    references: [personas.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

export const contentItemsRelations = relations(contentItems, ({ one }) => ({
  creator: one(users, {
    fields: [contentItems.creatorId],
    references: [users.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  fan: one(fans, {
    fields: [payments.fanId],
    references: [fans.id],
  }),
  creator: one(users, {
    fields: [payments.creatorId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertPersonaSchema = createInsertSchema(personas).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFanSchema = createInsertSchema(fans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertContentItemSchema = createInsertSchema(contentItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export const insertModerationQueueSchema = createInsertSchema(moderationQueue).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Persona = typeof personas.$inferSelect;
export type InsertPersona = z.infer<typeof insertPersonaSchema>;
export type Fan = typeof fans.$inferSelect;
export type InsertFan = z.infer<typeof insertFanSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type ContentItem = typeof contentItems.$inferSelect;
export type InsertContentItem = z.infer<typeof insertContentItemSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type ModerationQueue = typeof moderationQueue.$inferSelect;
export type InsertModerationQueue = z.infer<typeof insertModerationQueueSchema>;