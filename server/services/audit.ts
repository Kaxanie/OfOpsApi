import { storage } from "../storage";
import { InsertAuditLog, AuditLog } from "@shared/schema";

export class AuditService {
  async logAction(action: string, entityType: string, entityId: string, details: Record<string, any> = {}, userId?: string, fanId?: string, request?: any): Promise<void> {
    try {
      const auditLog: InsertAuditLog = {
        action,
        entityType,
        entityId,
        userId,
        fanId,
        details,
        ipAddress: this.getIPAddress(request),
        userAgent: this.getUserAgent(request),
      };

      await storage.createAuditLog(auditLog);
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw - audit failures shouldn't break the main operation
    }
  }

  async logConversation(conversationId: string, messageId: string, aiResponse: string, fanMessage: string, moderationResult: any): Promise<void> {
    await this.logAction('ai_conversation', 'conversation', conversationId, {
      messageId,
      aiResponse: aiResponse.substring(0, 200), // Truncate for storage
      fanMessage: fanMessage.substring(0, 200),
      moderationResult,
      timestamp: new Date().toISOString()
    });
  }

  async logPayment(paymentId: string, fanId: string, amountCents: number, productType: string, status: string): Promise<void> {
    await this.logAction('payment_event', 'payment', paymentId, {
      fanId,
      amountCents,
      productType,
      status,
      timestamp: new Date().toISOString()
    }, undefined, fanId);
  }

  async logContentAccess(contentId: string, fanId: string, accessType: 'view' | 'download' | 'purchase'): Promise<void> {
    await this.logAction('content_access', 'content_item', contentId, {
      accessType,
      timestamp: new Date().toISOString()
    }, undefined, fanId);
  }

  async logPersonaUpdate(personaId: string, userId: string, changes: Record<string, any>): Promise<void> {
    await this.logAction('persona_updated', 'persona', personaId, {
      changes,
      timestamp: new Date().toISOString()
    }, userId);
  }

  async logModerationAction(messageId: string, action: string, reason: string, severity: string, reviewedBy?: string): Promise<void> {
    await this.logAction('moderation_action', 'message', messageId, {
      action,
      reason,
      severity,
      reviewedBy,
      timestamp: new Date().toISOString()
    }, reviewedBy);
  }

  async logFanInteraction(fanId: string, interactionType: string, details: Record<string, any> = {}): Promise<void> {
    await this.logAction('fan_interaction', 'fan', fanId, {
      interactionType,
      ...details,
      timestamp: new Date().toISOString()
    }, undefined, fanId);
  }

  async getAuditTrail(entityType: string, entityId: string, limit: number = 100): Promise<AuditLog[]> {
    try {
      const logs = await storage.getAuditLogs(entityType, entityId);
      return logs.slice(0, limit);
    } catch (error) {
      console.error('Failed to retrieve audit trail:', error);
      return [];
    }
  }

  async getSecurityEvents(timeframe: 'hour' | 'day' | 'week' = 'day'): Promise<AuditLog[]> {
    try {
      const securityActions = [
        'failed_login',
        'suspicious_activity', 
        'moderation_escalation',
        'consent_violation',
        'stop_request'
      ];

      const allLogs = await storage.getAuditLogs();
      
      // Filter for security-relevant events in the specified timeframe
      const timeLimit = new Date();
      switch (timeframe) {
        case 'hour':
          timeLimit.setHours(timeLimit.getHours() - 1);
          break;
        case 'day':
          timeLimit.setDate(timeLimit.getDate() - 1);
          break;
        case 'week':
          timeLimit.setDate(timeLimit.getDate() - 7);
          break;
      }

      return allLogs.filter(log => 
        securityActions.includes(log.action) && 
        log.createdAt >= timeLimit
      );
    } catch (error) {
      console.error('Failed to retrieve security events:', error);
      return [];
    }
  }

  async generateComplianceReport(creatorId: string, startDate: Date, endDate: Date): Promise<{
    totalInteractions: number;
    moderatedMessages: number;
    blockedMessages: number;
    escalations: number;
    complianceScore: number;
    keyEvents: AuditLog[];
  }> {
    try {
      const logs = await storage.getAuditLogs();
      
      // Filter logs for the creator and date range
      const relevantLogs = logs.filter(log => 
        log.createdAt >= startDate && 
        log.createdAt <= endDate &&
        (log.userId === creatorId || log.details?.creatorId === creatorId)
      );

      const totalInteractions = relevantLogs.filter(log => 
        log.action === 'ai_conversation'
      ).length;

      const moderatedMessages = relevantLogs.filter(log => 
        log.action === 'moderation_action'
      ).length;

      const blockedMessages = relevantLogs.filter(log => 
        log.action === 'moderation_action' && 
        log.details?.action === 'block'
      ).length;

      const escalations = relevantLogs.filter(log => 
        log.action === 'moderation_action' && 
        log.details?.action === 'escalate'
      ).length;

      // Calculate compliance score
      let complianceScore = 100;
      if (totalInteractions > 0) {
        const violationRate = (blockedMessages + escalations * 2) / totalInteractions;
        complianceScore = Math.max(0, 100 - (violationRate * 100));
      }

      const keyEvents = relevantLogs
        .filter(log => ['moderation_action', 'payment_event', 'stop_request'].includes(log.action))
        .slice(0, 20); // Top 20 key events

      return {
        totalInteractions,
        moderatedMessages,
        blockedMessages,
        escalations,
        complianceScore: Math.round(complianceScore * 10) / 10,
        keyEvents
      };
    } catch (error) {
      console.error('Failed to generate compliance report:', error);
      return {
        totalInteractions: 0,
        moderatedMessages: 0,
        blockedMessages: 0,
        escalations: 0,
        complianceScore: 0,
        keyEvents: []
      };
    }
  }

  private getIPAddress(request?: any): string | undefined {
    if (!request) return undefined;
    return request.ip || request.connection?.remoteAddress || undefined;
  }

  private getUserAgent(request?: any): string | undefined {
    if (!request) return undefined;
    return request.get?.('User-Agent') || request.headers?.['user-agent'] || undefined;
  }
}

export const auditService = new AuditService();
