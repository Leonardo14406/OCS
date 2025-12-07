import OpenAI from 'openai';
import { logger } from '../logger';

export interface CoreClassificationResult {
  ministry: string | null;
  category: string | null;
  confidence: number;
  reasoning?: string;
}

/**
 * Core AI classification engine - handles the actual OpenAI classification
 * This is the only place where AI classification logic exists
 */
export class ClassificationEngine {
  private client: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Classify complaint text using AI with strict JSON schema
   */
  async classify(
    complaintText: string,
    ministries: string[],
    categories: string[]
  ): Promise<CoreClassificationResult> {
    const ministriesList = ministries.join(', ');
    const categoriesList = categories.join(', ');

    const prompt = `
You are an expert classification system for Sierra Leone government complaints. Analyze the complaint and classify it according to the provided schema.

COMPLAINT TEXT:
"${complaintText}"

AVAILABLE MINISTRIES:
${ministriesList}

AVAILABLE CATEGORIES:
${categoriesList}

TASK:
Classify this complaint by selecting the most appropriate ministry and category from the lists above. Respond ONLY with a valid JSON object matching this exact schema:
{
  "ministry": "string or null",
  "category": "string or null", 
  "confidence": "number between 0 and 1",
  "reasoning": "brief explanation of the classification choice"
}

RULES:
1. Ministry and category MUST be from the provided lists
2. If no ministry from the list is appropriate, set ministry to null
3. If no category from the list is appropriate, set category to null
4. Confidence should reflect how certain you are about the classification
5. Be conservative with confidence - if unsure, assign a lower score
6. Consider the specific details and context of the complaint
7. Provide brief reasoning for your classification choice
8. If the complaint is unclear or doesn't match available options, both ministry and category should be null

Example valid responses:
{"ministry": "Ministry of Health and Sanitation", "category": "service_delivery", "confidence": 0.85, "reasoning": "Complaint describes poor healthcare service"}
{"ministry": null, "category": null, "confidence": 0.2, "reasoning": "Complaint text is too vague to classify"}
{"ministry": "Ministry of Education", "category": "misconduct", "confidence": 0.72, "reasoning": "Complaint describes teacher misconduct"}
`;

    try {
      const response = await this.client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const result = JSON.parse(content);
      
      // Validate and sanitize the result
      const classification: CoreClassificationResult = {
        ministry: this.validateMinistry(result.ministry, ministries),
        category: this.validateCategory(result.category, categories),
        confidence: this.validateConfidence(result.confidence),
        reasoning: result.reasoning || 'No reasoning provided'
      };

      logger.info(
        { 
          ministry: classification.ministry,
          category: classification.category,
          confidence: classification.confidence,
          reasoning: classification.reasoning
        },
        'AI classification completed'
      );

      return classification;
    } catch (error) {
      logger.error({ error }, 'Error in ClassificationEngine');
      return {
        ministry: null,
        category: null,
        confidence: 0,
        reasoning: 'Classification failed due to error'
      };
    }
  }

  private validateMinistry(ministry: any, validMinistries: string[]): string | null {
    if (typeof ministry !== 'string' || !ministry.trim()) {
      return null;
    }
    
    const normalizedMinistry = ministry.trim();
    return validMinistries.includes(normalizedMinistry) ? normalizedMinistry : null;
  }

  private validateCategory(category: any, validCategories: string[]): string | null {
    if (typeof category !== 'string' || !category.trim()) {
      return null;
    }
    
    const normalizedCategory = category.trim();
    return validCategories.includes(normalizedCategory) ? normalizedCategory : null;
  }

  private validateConfidence(confidence: any): number {
    const num = Number(confidence);
    if (isNaN(num) || num < 0) {
      return 0;
    }
    if (num > 1) {
      return 1;
    }
    return num;
  }
}
