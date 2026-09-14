import { IntelligenceData } from '../../types.ts';

export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF-OPEN';

export interface AssistantAnswer {
  answer: string;
  source: 'gemini' | 'local_ml' | 'fallback';
  confidence?: number;
  suggestions?: string[];
}

export interface RecommendationResult {
  title: string;
  item: string;
  savingsHint: string;
  badge: string;
}

export interface AIProvider {
  name: string;
  isAvailable(): Promise<boolean>;
  getDemandIntelligence(): Promise<IntelligenceData>;
  askAssistant(query: string, context?: { userName?: string; history?: any[] }): Promise<AssistantAnswer>;
}

export interface AITelemetry {
  circuitState: CircuitBreakerState;
  providerName: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  rateLimitHits: number;
  fallbackCount: number;
  averageLatencyMs: number;
  lastFailureReason?: string;
  lastStateChange: string;
}
