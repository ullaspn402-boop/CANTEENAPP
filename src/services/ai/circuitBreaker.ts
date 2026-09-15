import type { CircuitBreakerState } from './types.ts';

interface CircuitBreakerConfig {
  failureThreshold: number; // e.g. 3 consecutive failures
  cooldownMs: number;       // e.g. 30000 ms before trying HALF-OPEN
  timeoutMs: number;        // e.g. 5000 ms per attempt
  maxRetries: number;       // e.g. 2 retries
  baseBackoffMs: number;    // e.g. 400 ms
}

export class CircuitBreaker {
  private state: CircuitBreakerState = 'CLOSED';
  private consecutiveFailures = 0;
  private nextAttemptTimestamp = 0;
  private lastStateChange = new Date().toISOString();
  private lastError: string | null = null;

  private totalRequests = 0;
  private successfulRequests = 0;
  private failedRequests = 0;
  private rateLimitHits = 0;
  private fallbackCount = 0;
  private latencySamples: number[] = [];

  private config: CircuitBreakerConfig;

  constructor(config: CircuitBreakerConfig) {
    this.config = config;
  }

  getState(): CircuitBreakerState {
    if (this.state === 'OPEN' && Date.now() >= this.nextAttemptTimestamp) {
      this.state = 'HALF-OPEN';
      this.lastStateChange = new Date().toISOString();
    }
    return this.state;
  }

  recordSuccess(latencyMs: number) {
    this.totalRequests++;
    this.successfulRequests++;
    this.consecutiveFailures = 0;
    this.lastError = null;

    this.latencySamples.push(latencyMs);
    if (this.latencySamples.length > 50) this.latencySamples.shift();

    if (this.state === 'HALF-OPEN') {
      this.state = 'CLOSED';
      this.lastStateChange = new Date().toISOString();
    }
  }

  recordFailure(error: any, isRateLimit: boolean = false) {
    this.totalRequests++;
    this.failedRequests++;
    this.consecutiveFailures++;
    this.lastError = error?.message || String(error);

    if (isRateLimit) {
      this.rateLimitHits++;
    }

    if (this.consecutiveFailures >= this.config.failureThreshold || this.state === 'HALF-OPEN') {
      this.state = 'OPEN';
      this.nextAttemptTimestamp = Date.now() + this.config.cooldownMs;
      this.lastStateChange = new Date().toISOString();
    }
  }

  recordFallback() {
    this.fallbackCount++;
  }

  getMetrics() {
    const avgLatency =
      this.latencySamples.length > 0
        ? Math.round(this.latencySamples.reduce((a, b) => a + b, 0) / this.latencySamples.length)
        : 0;

    return {
      circuitState: this.getState(),
      totalRequests: this.totalRequests,
      successfulRequests: this.successfulRequests,
      failedRequests: this.failedRequests,
      rateLimitHits: this.rateLimitHits,
      fallbackCount: this.fallbackCount,
      averageLatencyMs: avgLatency,
      lastFailureReason: this.lastError || undefined,
      lastStateChange: this.lastStateChange,
    };
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    fallback: () => Promise<T>
  ): Promise<{ result: T; usedFallback: boolean }> {
    const currentState = this.getState();

    if (currentState === 'OPEN') {
      this.recordFallback();
      const fbResult = await fallback();
      return { result: fbResult, usedFallback: true };
    }

    let attempt = 0;
    const maxRetries = this.config.maxRetries;

    while (attempt <= maxRetries) {
      const startTime = Date.now();
      try {
        // Execute operation with timeout
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('AI Operation Timed Out')), this.config.timeoutMs)
        );

        const result = await Promise.race([operation(), timeoutPromise]);
        const latency = Date.now() - startTime;
        this.recordSuccess(latency);
        return { result, usedFallback: false };
      } catch (err: any) {
        const isRateLimit =
          err?.status === 429 ||
          err?.statusCode === 429 ||
          err?.message?.includes('429') ||
          err?.message?.includes('RESOURCE_EXHAUSTED') ||
          err?.message?.includes('rate limit');

        const is5xx =
          err?.status >= 500 ||
          err?.statusCode >= 500 ||
          err?.message?.includes('500') ||
          err?.message?.includes('503') ||
          err?.message?.includes('Timed Out');

        // Check if retry is appropriate
        if ((isRateLimit || is5xx) && attempt < maxRetries) {
          attempt++;
          // Exponential backoff with jitter
          const base = this.config.baseBackoffMs * Math.pow(2, attempt);
          const jitter = Math.floor(Math.random() * 200);
          const delay = base + jitter;
          await new Promise((res) => setTimeout(res, delay));
          continue;
        }

        // Retries exhausted or non-retryable error
        this.recordFailure(err, isRateLimit);
        break;
      }
    }

    // Failed after retries or immediately rejected - invoke fallback
    this.recordFallback();
    const fbResult = await fallback();
    return { result: fbResult, usedFallback: true };
  }
}

export const aiCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  cooldownMs: 30000,
  timeoutMs: 5000,
  maxRetries: 2,
  baseBackoffMs: 300,
});
