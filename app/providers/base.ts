import { ProviderCallResult, VendorResponse } from "@/app/lib/types";
import { IProviderAdapter, ProviderConfig } from "./interfaces";
import { logger } from "@/app/lib/logger";

export abstract class BaseProviderAdapter implements IProviderAdapter {
  protected config: Required<ProviderConfig>;

  constructor(config: ProviderConfig = {}) {
    this.config = {
      timeoutMs: config.timeoutMs ?? 30000,
      maxRetries: config.maxRetries ?? 3,
      retryDelayMs: config.retryDelayMs ?? 1000,
    };
  }

  abstract getName(): string;
  protected abstract callProvider(
    messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
    systemPrompt?: string
  ): Promise<ProviderCallResult>;

  async chat(
    messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
    systemPrompt?: string
  ): Promise<ProviderCallResult> {
    let lastError: ProviderCallResult | null = null;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      const startTime = Date.now();

      try {
        const result = await Promise.race([
          this.callProvider(messages, systemPrompt),
          this.createTimeout(),
        ]);

        const latencyMs = Date.now() - startTime;

        if (result.success) {
          logger.info(`Provider ${this.getName()} call succeeded`, {
            attempt: attempt + 1,
            latencyMs,
          });
          return { ...result, latencyMs };
        }

        lastError = { ...result, latencyMs };

        // Don't retry on certain errors
        if (
          result.error?.statusCode === 400 ||
          result.error?.code === "INVALID_REQUEST"
        ) {
          logger.warn(`Provider ${this.getName()} returned non-retryable error`, {
            error: result.error,
            attempt: attempt + 1,
          });
          return result;
        }

        // Check if we should retry
        if (attempt < this.config.maxRetries) {
          const retryAfter = result.error?.retryAfterMs ?? this.config.retryDelayMs;
          const backoffDelay = retryAfter * Math.pow(2, attempt); // Exponential backoff

          logger.warn(`Provider ${this.getName()} call failed, retrying`, {
            attempt: attempt + 1,
            error: result.error,
            retryAfter: backoffDelay,
          });

          await this.sleep(backoffDelay);
        }
      } catch (error) {
        const latencyMs = Date.now() - startTime;
        lastError = {
          success: false,
          error: {
            code: "TIMEOUT",
            message: error instanceof Error ? error.message : "Request timeout",
          },
          latencyMs,
        };

        if (attempt < this.config.maxRetries) {
          const backoffDelay = this.config.retryDelayMs * Math.pow(2, attempt);
          logger.warn(`Provider ${this.getName()} timeout, retrying`, {
            attempt: attempt + 1,
            retryAfter: backoffDelay,
          });
          await this.sleep(backoffDelay);
        }
      }
    }

    logger.error(`Provider ${this.getName()} call failed after all retries`, {
      error: lastError?.error,
    });

    return lastError ?? {
      success: false,
      error: { code: "UNKNOWN_ERROR", message: "Provider call failed" },
      latencyMs: 0,
    };
  }

  private createTimeout(): Promise<ProviderCallResult> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: false,
          error: {
            code: "TIMEOUT",
            message: `Request timeout after ${this.config.timeoutMs}ms`,
          },
          latencyMs: this.config.timeoutMs,
        });
      }, this.config.timeoutMs);
    });
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
