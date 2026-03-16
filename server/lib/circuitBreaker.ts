import { logger } from "./logger";

type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export class CircuitBreaker {
  private state: CircuitState = "CLOSED";
  private failures = 0;
  private lastFailure = 0;

  constructor(
    private readonly name: string,
    private readonly threshold: number,
    private readonly cooldownMs: number
  ) {}

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (Date.now() - this.lastFailure > this.cooldownMs) {
        this.state = "HALF_OPEN";
      } else {
        throw new Error(`Circuit breaker ${this.name} is OPEN`);
      }
    }
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = "CLOSED";
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailure = Date.now();
    if (this.failures >= this.threshold) {
      this.state = "OPEN";
      logger.warn(`Circuit breaker ${this.name} opened after ${this.failures} failures`);
    }
  }
}

export const sendgridBreaker = new CircuitBreaker("sendgrid", 3, 120000);
export const twilioBreaker = new CircuitBreaker("twilio", 3, 120000);
export const openaiBreaker = new CircuitBreaker("openai", 5, 60000);
export const metaBreaker = new CircuitBreaker("meta", 3, 120000);
export const valueSerpBreaker = new CircuitBreaker("valueserp", 3, 300000); // 5min cooldown
export const perplexityBreaker = new CircuitBreaker("perplexity", 3, 300000);
export const anthropicSeoBreaker = new CircuitBreaker("anthropic-seo", 3, 300000);
