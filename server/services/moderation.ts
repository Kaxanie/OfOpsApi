import { storage } from "../storage";
import { InsertModerationQueue } from "@shared/schema";

export interface ModerationResult {
  action: 'allow' | 'block' | 'escalate' | 'review';
  reason?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
}

export class ModerationService {
  private bannedPatterns: RegExp[] = [
    /\b(?:fuck|shit|damn|bitch)\b/gi, // Profanity
    /\b(?:meet|meetup|hotel|address|phone)\b/gi, // IRL meetup attempts
    /\b(?:under|kid|minor|teen|child)\b.*\b(?:18|years|age)\b/gi, // Age-related
    /\b(?:suicide|kill|death|harm)\b/gi, // Violence/self-harm
    /\b(?:drug|cocaine|heroin|meth)\b/gi, // Illegal substances
  ];

  private suspiciousPatterns: RegExp[] = [
    /\b(?:daddy|baby|little)\b/gi, // Age-play indicators
    /\b(?:rape|force|non-consent)\b/gi, // Non-consensual content
    /\b(?:send|show|pics|nude)\b.*\b(?:free|no|without)\b/gi, // Demanding free content
    /\$\d+.*\b(?:cash|paypal|venmo)\b/gi, // Off-platform payments
  ];

  private escalationPatterns: RegExp[] = [
    /\b(?:minor|under.*18|underage)\b/gi, // Minor-related content
    /\b(?:kill|suicide|harm|violence)\b/gi, // Violence/threats
    /\b(?:personal|real|actual|home)\b.*\b(?:address|location|meet)\b/gi, // Doxxing/stalking
  ];

  async moderateMessage(content: string, fanId?: string): Promise<ModerationResult> {
    const normalizedContent = content.toLowerCase().trim();
    
    // Check for escalation patterns first (highest severity)
    for (const pattern of this.escalationPatterns) {
      if (pattern.test(content)) {
        await this.logToModerationQueue(content, 'escalation_pattern', 'critical');
        return {
          action: 'escalate',
          reason: 'Content matches critical violation pattern',
          severity: 'critical',
          confidence: 0.95
        };
      }
    }

    // Check for banned patterns
    for (const pattern of this.bannedPatterns) {
      if (pattern.test(content)) {
        await this.logToModerationQueue(content, 'banned_pattern', 'high');
        return {
          action: 'block',
          reason: 'Content matches banned pattern',
          severity: 'high',
          confidence: 0.9
        };
      }
    }

    // Check for suspicious patterns
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(content)) {
        await this.logToModerationQueue(content, 'suspicious_pattern', 'medium');
        return {
          action: 'review',
          reason: 'Content matches suspicious pattern',
          severity: 'medium',
          confidence: 0.7
        };
      }
    }

    // Check message length and complexity
    if (content.length < 3) {
      return {
        action: 'allow',
        severity: 'low',
        confidence: 0.8
      };
    }

    // Allow by default
    return {
      action: 'allow',
      severity: 'low',
      confidence: 0.95
    };
  }

  private async logToModerationQueue(content: string, flagReason: string, severity: 'low' | 'medium' | 'high' | 'critical'): Promise<void> {
    try {
      await storage.createModerationQueue({
        content,
        flagReason,
        severity,
        status: 'pending'
      });
    } catch (error) {
      console.error('Failed to log to moderation queue:', error);
    }
  }

  async checkConsentGate(fanId: string): Promise<boolean> {
    try {
      const fan = await storage.getFan(fanId);
      if (!fan) return false;

      const consent = fan.consentStatus as any;
      return consent?.ageAffirmed && consent?.romanticContent;
    } catch (error) {
      console.error('Error checking consent gate:', error);
      return false;
    }
  }

  async checkStopWords(content: string): Promise<boolean> {
    const stopWords = ['stop', 'unsubscribe', 'no', 'quit', 'end', 'block'];
    const normalizedContent = content.toLowerCase().trim();
    
    return stopWords.some(word => 
      normalizedContent === word || 
      normalizedContent.includes(` ${word} `) ||
      normalizedContent.startsWith(`${word} `) ||
      normalizedContent.endsWith(` ${word}`)
    );
  }

  async escalateMessage(content: string, reason: string, fanId?: string): Promise<void> {
    console.error(`ESCALATION: ${reason}`, { content, fanId });
    
    // Log to moderation queue for human review
    await this.logToModerationQueue(content, `ESCALATED: ${reason}`, 'critical');
    
    // In a real implementation, this would:
    // - Send alert to human moderators
    // - Temporarily suspend AI responses to this fan
    // - Log detailed incident report
    // - Potentially contact platform safety teams
  }

  async getComplianceScore(): Promise<number> {
    try {
      const queue = await storage.getModerationQueue();
      const total = queue.length;
      
      if (total === 0) return 100;
      
      const blocked = queue.filter(item => item.status === 'blocked').length;
      const escalated = queue.filter(item => item.severity === 'critical').length;
      
      // Calculate score based on violations
      const violationRate = (blocked + escalated * 2) / total;
      const score = Math.max(0, 100 - (violationRate * 100));
      
      return Math.round(score * 10) / 10; // Round to 1 decimal place
    } catch (error) {
      console.error('Error calculating compliance score:', error);
      return 98.0; // Default safe score
    }
  }

  async processStopRequest(fanId: string): Promise<void> {
    try {
      // Update fan preferences to opt out
      await storage.updateFan(fanId, {
        boundaries: ['stop_all_messages'],
        preferences: { opted_out: true }
      });

      // Log the stop request
      await storage.createAuditLog({
        action: 'stop_request',
        entityType: 'fan',
        entityId: fanId,
        details: { reason: 'user_requested_stop' }
      });

      console.log(`Stop request processed for fan: ${fanId}`);
    } catch (error) {
      console.error('Error processing stop request:', error);
    }
  }
}

export const moderationService = new ModerationService();
