import type { AIProvider, AssistantAnswer, AITelemetry } from './types.ts';
import type { IntelligenceData } from '../../types.ts';
import { GeminiProvider } from './providers/geminiProvider.ts';
import { LocalMLProvider } from './providers/localMLProvider.ts';
import { FallbackProvider } from './providers/fallbackProvider.ts';
import { aiCircuitBreaker } from './circuitBreaker.ts';
import { appCache } from '../../lib/cache.ts';

class AIService {
  private geminiProvider = new GeminiProvider();
  private localMLProvider = new LocalMLProvider();
  private fallbackProvider = new FallbackProvider();

  /**
   * Fetch demand intelligence with caching, circuit-breaker retry, and multi-tier fallback.
   * Never throws or disrupts core canteen operations!
   */
  async getIntelligence(): Promise<IntelligenceData> {
    const cacheKey = 'canteen_intelligence_summary';
    const cached = appCache.get<IntelligenceData>(cacheKey);
    if (cached) {
      return cached;
    }

    const { result } = await aiCircuitBreaker.executeWithRetry<IntelligenceData>(
      async () => {
        // If Gemini is configured and circuit is not open, we can try it, or default to LocalML
        if (typeof process !== 'undefined' && (process.env?.VITE_GEMINI_API_KEY || process.env?.GEMINI_API_KEY)) {
          try {
            return await this.geminiProvider.getDemandIntelligence();
          } catch (e) {
            // If Gemini fails, use LocalML within retry block
            return await this.localMLProvider.getDemandIntelligence();
          }
        }
        // By default use LocalML (PostgreSQL historical data)
        return await this.localMLProvider.getDemandIntelligence();
      },
      async () => {
        // Fallback tier 1: LocalML
        try {
          return await this.localMLProvider.getDemandIntelligence();
        } catch (localErr) {
          // Fallback tier 2: Static baseline heuristics
          return await this.fallbackProvider.getDemandIntelligence();
        }
      }
    );

    // Cache non-personalized intelligence for 3 minutes
    appCache.set(cacheKey, result, 3 * 60 * 1000);
    return result;
  }

  /**
   * Student conversational canteen query with circuit breaker and failover.
   */
  async askStudentAssistant(query: string, context?: { userName?: string }): Promise<AssistantAnswer> {
    const { result } = await aiCircuitBreaker.executeWithRetry<AssistantAnswer>(
      async () => {
        if (typeof process !== 'undefined' && (process.env?.VITE_GEMINI_API_KEY || process.env?.GEMINI_API_KEY)) {
          return await this.geminiProvider.askAssistant(query, context);
        }
        return await this.localMLProvider.askAssistant(query, context);
      },
      async () => {
        try {
          return await this.localMLProvider.askAssistant(query, context);
        } catch {
          return await this.fallbackProvider.askAssistant(query);
        }
      }
    );

    return result;
  }

  /**
   * Returns live telemetry for Admin System Health
   */
  getTelemetry(): AITelemetry {
    const cbMetrics = aiCircuitBreaker.getMetrics();
    const hasApiKey = Boolean(typeof process !== 'undefined' && (process.env?.VITE_GEMINI_API_KEY || process.env?.GEMINI_API_KEY));

    let activeProvider = 'LocalMLProvider (Cloud SQL)';
    if (hasApiKey && cbMetrics.circuitState === 'CLOSED') {
      activeProvider = 'Google Gemini (Primary)';
    } else if (cbMetrics.circuitState === 'OPEN') {
      activeProvider = 'LocalMLProvider (Failover - Circuit Open)';
    }

    return {
      circuitState: cbMetrics.circuitState,
      providerName: activeProvider,
      totalRequests: cbMetrics.totalRequests,
      successfulRequests: cbMetrics.successfulRequests,
      failedRequests: cbMetrics.failedRequests,
      rateLimitHits: cbMetrics.rateLimitHits,
      fallbackCount: cbMetrics.fallbackCount,
      averageLatencyMs: cbMetrics.averageLatencyMs,
      lastFailureReason: cbMetrics.lastFailureReason,
      lastStateChange: cbMetrics.lastStateChange,
    };
  }
}

export const aiService = new AIService();
