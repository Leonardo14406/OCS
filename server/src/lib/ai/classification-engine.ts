import { ClassificationEngine } from './classification-core';
import { SemanticMatcher } from './semantic-matcher';
import { logger } from '../logger';
import { PrismaClient } from '@prisma/client';

export interface ClassificationResult {
  ministry: string;
  category: string;
  confidence: number;
  fallbackUsed: boolean;
  originalMinistry?: string;
  originalCategory?: string;
}

export interface ClassificationConfig {
  confidenceThreshold: number;
  enableSemanticFallback: boolean;
  maxSemanticDistance: number;
}

export class ComplaintClassificationService {
  private classificationEngine: ClassificationEngine;
  private semanticMatcher: SemanticMatcher;
  private prisma: PrismaClient;
  private config: ClassificationConfig;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  constructor(prisma: PrismaClient, config?: Partial<ClassificationConfig>) {
    this.prisma = prisma;
    this.config = {
      confidenceThreshold: 0.6,
      enableSemanticFallback: true,
      maxSemanticDistance: 0.3,
      ...config
    };
    
    this.classificationEngine = new ClassificationEngine();
    this.semanticMatcher = new SemanticMatcher();
  }

  /**
   * Main classification method - the only place where classification logic exists
   */
  async classifyComplaint(complaintText: string): Promise<ClassificationResult> {
    try {
      logger.info({ textLength: complaintText.length }, 'Starting complaint classification');

      // Get current ministries and categories from database
      const { ministries, categories } = await this.getDatabaseTaxonomy();
      
      // Primary classification using AI engine
      const primaryResult = await this.classificationEngine.classify(
        complaintText,
        ministries,
        categories
      );

      logger.info(
        { 
          ministry: primaryResult.ministry,
          category: primaryResult.category,
          confidence: primaryResult.confidence 
        },
        'Primary classification result'
      );

      // Check if we need fallback matching
      if (primaryResult.confidence < this.config.confidenceThreshold || 
          !primaryResult.ministry || 
          !primaryResult.category) {
        
        logger.info({}, 'Using semantic fallback matching');
        const fallbackResult = await this.applySemanticFallback(
          complaintText,
          primaryResult,
          ministries,
          categories
        );
        
        return fallbackResult;
      }

      // Validate that ministry and category exist in database
      const validatedResult = await this.validateAgainstDatabase(
        primaryResult,
        ministries,
        categories
      );

      return {
        ministry: validatedResult.ministry,
        category: validatedResult.category,
        confidence: primaryResult.confidence,
        fallbackUsed: false
      };

    } catch (error) {
      logger.error({ error }, 'Classification failed');
      
      // Emergency fallback to default ministry/category
      return this.getEmergencyFallback();
    }
  }

  /**
   * Update complaint record with classification results
   */
  async updateComplaintClassification(
    complaintId: string,
    classification: ClassificationResult
  ): Promise<void> {
    try {
      await this.prisma.complaint.update({
        where: { id: complaintId },
        data: {
          ministry: classification.ministry,
          category: classification.category
        }
      });

      // Also update conversation session if exists
      await this.updateSessionClassification(complaintId, classification);

      logger.info(
        { 
          complaintId,
          ministry: classification.ministry,
          category: classification.category,
          fallbackUsed: classification.fallbackUsed
        },
        'Complaint classification updated'
      );
    } catch (error) {
      logger.error({ error, complaintId }, 'Failed to update complaint classification');
      throw error;
    }
  }

  /**
   * Apply semantic similarity fallback when primary classification is insufficient
   */
  private async applySemanticFallback(
    complaintText: string,
    primaryResult: any,
    ministries: string[],
    categories: string[]
  ): Promise<ClassificationResult> {
    const fallbackResult = await this.semanticMatcher.findBestMatch(
      complaintText,
      ministries,
      categories,
      primaryResult
    );

    return {
      ministry: fallbackResult.ministry,
      category: fallbackResult.category,
      confidence: fallbackResult.confidence,
      fallbackUsed: true,
      originalMinistry: primaryResult.ministry,
      originalCategory: primaryResult.category
    };
  }

  /**
   * Validate classification results against database entries
   */
  private async validateAgainstDatabase(
    result: any,
    ministries: string[],
    categories: string[]
  ): Promise<{ ministry: string; category: string }> {
    let validatedMinistry = result.ministry;
    let validatedCategory = result.category;

    // Find closest matching ministry if not found
    if (result.ministry && !ministries.includes(result.ministry)) {
      validatedMinistry = await this.semanticMatcher.findClosestString(
        result.ministry,
        ministries
      );
    }

    // Find closest matching category if not found
    if (result.category && !categories.includes(result.category)) {
      validatedCategory = await this.semanticMatcher.findClosestString(
        result.category,
        categories
      );
    }

    return {
      ministry: validatedMinistry || ministries[0],
      category: validatedCategory || categories[0]
    };
  }

  /**
   * Get current taxonomy from database with caching
   */
  private async getDatabaseTaxonomy(): Promise<{ ministries: string[]; categories: string[] }> {
    const cacheKey = 'taxonomy';
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const [ministries, categories] = await Promise.all([
      this.prisma.ministry.findMany({ select: { name: true } }),
      this.prisma.complaintCategory.findMany({ select: { name: true } })
    ]);

    const result = {
      ministries: ministries.map(m => m.name),
      categories: categories.map(c => c.name)
    };

    // Cache for 5 minutes
    this.setCachedData(cacheKey, result, 300000);
    return result;
  }

  /**
   * Update conversation session classification
   */
  private async updateSessionClassification(
    complaintId: string,
    classification: ClassificationResult
  ): Promise<void> {
    try {
      const complaint = await this.prisma.complaint.findUnique({
        where: { id: complaintId },
        select: { complainantId: true }
      });

      if (complaint?.complainantId) {
        const session = await this.prisma.conversationSession.findFirst({
          where: { userId: complaint.complainantId }
        });

        if (session) {
          await this.prisma.conversationSession.update({
            where: { sessionId: session.sessionId },
            data: {
              classifiedMinistry: classification.ministry,
              classifiedCategory: classification.category
            }
          });
        }
      }
    } catch (error) {
      logger.warn({ error, complaintId }, 'Could not update session classification');
    }
  }

  /**
   * Emergency fallback when all else fails
   */
  private getEmergencyFallback(): ClassificationResult {
    return {
      ministry: 'Ministry of Health and Sanitation',
      category: 'service_delivery',
      confidence: 0.1,
      fallbackUsed: true
    };
  }

  /**
   * Cache management helpers
   */
  private getCachedData(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < 300000) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear caches (useful for testing or when taxonomy changes)
   */
  clearCache(): void {
    this.cache.clear();
  }
}
