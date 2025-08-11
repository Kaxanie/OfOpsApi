import { apiRequest } from "./queryClient";

export interface DashboardMetrics {
  totalRevenue: number;
  activeConversations: number;
  conversionRate: number;
  safetyScore: number;
  messagesSentToday: number;
  moderatedToday: number;
  blockedToday: number;
}

export interface Persona {
  id: string;
  creatorId: string;
  name: string;
  bio?: string;
  voiceKeywords?: string[];
  doSay?: string[];
  dontSay?: string[];
  offerMenu?: Array<{sku: string, label: string, priceCents: number}>;
  disclosure?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Fan {
  id: string;
  xUserId: string;
  handle: string;
  displayName?: string;
  timezone?: string;
  spendTier: string;
  lastPurchaseAt?: string;
  consentStatus?: {
    ageAffirmed: boolean;
    romanticContent: boolean;
    timestamp: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  fanId: string;
  personaId: string;
  threadSummary?: string;
  sentiment?: string;
  lastMessageAt?: string;
  isActive: boolean;
  fan?: Fan;
  createdAt: string;
  updatedAt: string;
}

export interface ContentItem {
  id: string;
  creatorId: string;
  type: 'image' | 'video' | 'audio';
  title: string;
  url: string;
  thumbnailUrl?: string;
  priceCents: number;
  purchaseCount: number;
  revenue: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ModerationQueueItem {
  id: string;
  content: string;
  flagReason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'approved' | 'blocked';
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

// API Functions
export const api = {
  // Dashboard
  async getDashboardMetrics(creatorId: string): Promise<DashboardMetrics> {
    const res = await apiRequest("GET", `/api/dashboard/metrics/${creatorId}`);
    return res.json();
  },

  // Personas
  async getPersona(creatorId: string): Promise<Persona | null> {
    try {
      const res = await apiRequest("GET", `/api/personas/creator/${creatorId}`);
      return res.json();
    } catch (error: any) {
      if (error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  },

  async createPersona(persona: Omit<Persona, 'id' | 'createdAt' | 'updatedAt'>): Promise<Persona> {
    const res = await apiRequest("POST", "/api/personas", persona);
    return res.json();
  },

  async updatePersona(id: string, updates: Partial<Persona>): Promise<Persona> {
    const res = await apiRequest("PUT", `/api/personas/${id}`, updates);
    return res.json();
  },

  // Conversations
  async getActiveConversations(personaId: string): Promise<Conversation[]> {
    const res = await apiRequest("GET", `/api/conversations/active/${personaId}`);
    return res.json();
  },

  // Content
  async getContentItems(creatorId: string): Promise<ContentItem[]> {
    const res = await apiRequest("GET", `/api/content/creator/${creatorId}`);
    return res.json();
  },

  async getTopPerformingContent(creatorId: string, limit = 10): Promise<ContentItem[]> {
    const res = await apiRequest("GET", `/api/content/top/${creatorId}?limit=${limit}`);
    return res.json();
  },

  async createContent(content: Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt' | 'purchaseCount' | 'revenue'>): Promise<ContentItem> {
    const res = await apiRequest("POST", "/api/content", content);
    return res.json();
  },

  // Moderation
  async getModerationQueue(status?: string): Promise<ModerationQueueItem[]> {
    const url = status ? `/api/moderation/queue?status=${status}` : "/api/moderation/queue";
    const res = await apiRequest("GET", url);
    return res.json();
  },

  async updateModerationItem(id: string, updates: { status: string; reviewedBy?: string }): Promise<ModerationQueueItem> {
    const res = await apiRequest("PUT", `/api/moderation/queue/${id}`, updates);
    return res.json();
  },

  // Analytics
  async getSafetyAnalytics(): Promise<{
    complianceScore: number;
    pendingReviews: number;
    totalModerated: number;
  }> {
    const res = await apiRequest("GET", "/api/analytics/safety");
    return res.json();
  },

  async getRevenue(creatorId: string): Promise<{
    totalRevenue: number;
    paymentCount: number;
  }> {
    const res = await apiRequest("GET", `/api/analytics/revenue/${creatorId}`);
    return res.json();
  },

  // Payment
  async createPaymentIntent(data: {
    amountCents: number;
    fanId: string;
    creatorId: string;
    productType: string;
    metadata?: Record<string, any>;
  }): Promise<{ clientSecret: string }> {
    const res = await apiRequest("POST", "/api/create-payment-intent", data);
    return res.json();
  },
};
