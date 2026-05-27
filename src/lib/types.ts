/**
 * Shared types for DealFlow
 * Extracted to avoid circular dependency between db.ts and deepseek.ts
 */

export interface DealCandidate {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  source: 'product_hunt' | 'github' | 'crunchbase' | 'twitter';
  url: string;
  metrics?: string;
  timestamp: string;
}

export interface InvestorPreferences {
  sectors: string[];
  stage: string;
  geography: string;
  signals: string[];
  thesis?: string;
}

export interface DealScore {
  score: number;
  verdict: 'STRONG_MATCH' | 'MODERATE_MATCH' | 'WEAK_MATCH' | 'PASS';
  oneLiner: string;
  strengths: string[];
  risks: string[];
  suggestedAction: string;
}

export interface ScoredDeal {
  deal: DealCandidate;
  score: DealScore;
}
