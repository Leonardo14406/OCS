import { logger } from '../logger';

export interface SemanticMatchResult {
  ministry: string;
  category: string;
  confidence: number;
  matchType: 'exact' | 'semantic' | 'fuzzy';
  distance?: number;
}

/**
 * Semantic and fuzzy matching for fallback classification
 * Uses string similarity and keyword matching when AI confidence is low
 */
export class SemanticMatcher {
  private ministryKeywords: Map<string, string[]> = new Map();
  private categoryKeywords: Map<string, string[]> = new Map();

  constructor() {
    this.initializeKeywordMappings();
  }

  /**
   * Find best match using semantic similarity and keyword matching
   */
  async findBestMatch(
    complaintText: string,
    ministries: string[],
    categories: string[],
    primaryResult: any
  ): Promise<SemanticMatchResult> {
    const normalizedText = complaintText.toLowerCase();
    
    // Try exact keyword matching first
    const keywordMatch = this.findKeywordMatch(normalizedText, ministries, categories);
    if (keywordMatch.confidence > 0.7) {
      return keywordMatch;
    }

    // Try fuzzy string matching
    const fuzzyMatch = this.findFuzzyMatch(
      primaryResult.ministry || '',
      primaryResult.category || '',
      ministries,
      categories
    );
    
    if (fuzzyMatch.confidence > 0.5) {
      return fuzzyMatch;
    }

    // Default to first available ministry/category with low confidence
    return {
      ministry: ministries[0] || 'Ministry of Health and Sanitation',
      category: categories[0] || 'service_delivery',
      confidence: 0.3,
      matchType: 'fuzzy'
    };
  }

  /**
   * Find closest string match using Levenshtein distance
   */
  async findClosestString(target: string, candidates: string[]): Promise<string> {
    if (!target || candidates.length === 0) {
      return candidates[0] || '';
    }

    let bestMatch = candidates[0];
    let bestDistance = this.levenshteinDistance(target.toLowerCase(), bestMatch.toLowerCase());

    for (let i = 1; i < candidates.length; i++) {
      const distance = this.levenshteinDistance(target.toLowerCase(), candidates[i].toLowerCase());
      if (distance < bestDistance) {
        bestDistance = distance;
        bestMatch = candidates[i];
      }
    }

    // If distance is too high, return the first candidate
    if (bestDistance > target.length * 0.6) {
      return candidates[0];
    }

    return bestMatch;
  }

  /**
   * Keyword-based matching for high-confidence cases
   */
  private findKeywordMatch(
    text: string,
    ministries: string[],
    categories: string[]
  ): SemanticMatchResult {
    let bestMinistry = '';
    let bestCategory = '';
    let ministryScore = 0;
    let categoryScore = 0;

    // Match ministry keywords
    for (const [ministry, keywords] of this.ministryKeywords) {
      if (ministries.includes(ministry)) {
        const score = this.calculateKeywordScore(text, keywords);
        if (score > ministryScore) {
          ministryScore = score;
          bestMinistry = ministry;
        }
      }
    }

    // Match category keywords
    for (const [category, keywords] of this.categoryKeywords) {
      if (categories.includes(category)) {
        const score = this.calculateKeywordScore(text, keywords);
        if (score > categoryScore) {
          categoryScore = score;
          bestCategory = category;
        }
      }
    }

    const confidence = (ministryScore + categoryScore) / 2;

    return {
      ministry: bestMinistry || ministries[0],
      category: bestCategory || categories[0],
      confidence,
      matchType: confidence > 0.8 ? 'exact' : 'semantic'
    };
  }

  /**
   * Fuzzy matching for low-confidence AI results
   */
  private findFuzzyMatch(
    targetMinistry: string,
    targetCategory: string,
    ministries: string[],
    categories: string[]
  ): SemanticMatchResult {
    const ministryMatch = this.findBestFuzzyMatch(targetMinistry, ministries);
    const categoryMatch = this.findBestFuzzyMatch(targetCategory, categories);

    return {
      ministry: ministryMatch.candidate,
      category: categoryMatch.candidate,
      confidence: (ministryMatch.score + categoryMatch.score) / 2,
      matchType: 'fuzzy',
      distance: (ministryMatch.distance + categoryMatch.distance) / 2
    };
  }

  private findBestFuzzyMatch(target: string, candidates: string[]): { candidate: string; score: number; distance: number } {
    if (!target || candidates.length === 0) {
      return { candidate: candidates[0] || '', score: 0, distance: 1 };
    }

    let bestCandidate = candidates[0];
    let bestDistance = this.levenshteinDistance(target.toLowerCase(), bestCandidate.toLowerCase());
    let bestScore = 1 - (bestDistance / Math.max(target.length, bestCandidate.length));

    for (let i = 1; i < candidates.length; i++) {
      const distance = this.levenshteinDistance(target.toLowerCase(), candidates[i].toLowerCase());
      const score = 1 - (distance / Math.max(target.length, candidates[i].length));
      
      if (score > bestScore) {
        bestScore = score;
        bestDistance = distance;
        bestCandidate = candidates[i];
      }
    }

    return { candidate: bestCandidate, score: bestScore, distance: bestDistance };
  }

  private calculateKeywordScore(text: string, keywords: string[]): number {
    if (keywords.length === 0) return 0;

    let matches = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        matches++;
      }
    }

    return matches / keywords.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => 
      Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Initialize keyword mappings for common Sierra Leone government terms
   */
  private initializeKeywordMappings(): void {
    // Ministry keywords
    this.ministryKeywords.set('Ministry of Health and Sanitation', [
      'health', 'hospital', 'doctor', 'nurse', 'medical', 'clinic', 'sanitation', 'disease', 'medicine', 'treatment'
    ]);

    this.ministryKeywords.set('Ministry of Education', [
      'school', 'teacher', 'student', 'education', 'classroom', 'university', 'college', 'exam', 'curriculum', 'learning'
    ]);

    this.ministryKeywords.set('Ministry of Works and Infrastructure', [
      'road', 'bridge', 'construction', 'building', 'infrastructure', 'public works', 'maintenance', 'repair', 'development'
    ]);

    this.ministryKeywords.set('Sierra Leone Police', [
      'police', 'security', 'crime', 'arrest', 'law enforcement', 'officer', 'safety', 'theft', 'violence', 'investigation'
    ]);

    this.ministryKeywords.set('Ministry of Finance', [
      'money', 'budget', 'finance', 'tax', 'revenue', 'funding', 'financial', 'accounting', 'treasury', 'economy'
    ]);

    // Category keywords
    this.categoryKeywords.set('service_delivery', [
      'service', 'delivery', 'poor service', 'slow service', 'no service', 'bad service', 'inefficient', 'delay'
    ]);

    this.categoryKeywords.set('misconduct', [
      'misconduct', 'corruption', 'bribe', 'unethical', 'abuse', 'harassment', 'discrimination', 'fraud', 'dishonest'
    ]);

    this.categoryKeywords.set('negligence', [
      'negligent', 'negligence', 'careless', 'irresponsible', 'failure', 'ignored', 'neglected', 'abandoned'
    ]);

    this.categoryKeywords.set('bureaucracy', [
      'bureaucracy', 'red tape', 'paperwork', 'procedure', 'process', 'delay', 'complicated', 'slow process'
    ]);

    this.categoryKeywords.set('infrastructure', [
      'infrastructure', 'building', 'road', 'bridge', 'construction', 'maintenance', 'repair', 'facility'
    ]);

    logger.info({}, 'Keyword mappings initialized for semantic matching');
  }
}
