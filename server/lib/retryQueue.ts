import { logger } from "./logger";

type RetryFn = () => Promise<void>;

interface QueueEntry {
  fn: RetryFn;
  retries: number;
  maxRetries: number;
  nextAttempt: number;
}

export class RetryQueue {
  private queue: QueueEntry[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly name: string) {
    this.timer = setInterval(() => this.process(), 5000);
  }

  enqueue(fn: RetryFn, maxRetries = 3): void {
    this.queue.push({ fn, retries: 0, maxRetries, nextAttempt: Date.now() });
  }

  private async process(): Promise<void> {
    const now = Date.now();
    const ready = this.queue.filter(e => e.nextAttempt <= now);
    for (const entry of ready) {
      try {
        await entry.fn();
        this.queue = this.queue.filter(e => e !== entry);
      } catch (error) {
        entry.retries++;
        if (entry.retries >= entry.maxRetries) {
          logger.error(`${this.name}: max retries reached, dropping`, { retries: entry.retries });
          this.queue = this.queue.filter(e => e !== entry);
        } else {
          const backoff = [10000, 40000, 90000][entry.retries - 1] ?? 90000;
          entry.nextAttempt = now + backoff;
          logger.warn(`${this.name}: retry ${entry.retries}/${entry.maxRetries} in ${backoff}ms`);
        }
      }
    }
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

export const emailQueue = new RetryQueue("email");
export const whatsappQueue = new RetryQueue("whatsapp");
