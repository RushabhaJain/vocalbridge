import { BaseProviderAdapter } from "./base";
import { ProviderCallResult, VendorResponse } from "@/app/lib/types";
import { logger } from "@/app/lib/logger";

/**
 * VendorB Provider Adapter
 * - Response format: { choices: [{ message: { content } }], usage: { input_tokens, output_tokens } }
 * - Failure behavior: Can return HTTP 429 with retryAfterMs
 */
export class VendorBAdapter extends BaseProviderAdapter {
  getName(): string {
    return "vendorB";
  }

  protected async callProvider(
    messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
    systemPrompt?: string
  ): Promise<ProviderCallResult> {
    const startTime = Date.now();

    // Simulate network latency (50ms - 1500ms)
    const latency = Math.random() * 1450 + 50;
    await this.sleep(Math.floor(latency));

    // ~8% chance of HTTP 429 (rate limit)
    if (Math.random() < 0.08) {
      const retryAfterMs = Math.floor(Math.random() * 2000) + 500;
      logger.warn("VendorB simulated HTTP 429 rate limit", { retryAfterMs });
      return {
        success: false,
        error: {
          code: "RATE_LIMIT",
          message: "Rate limit exceeded",
          statusCode: 429,
          retryAfterMs,
        },
        latencyMs: Date.now() - startTime,
      };
    }

    // Generate mock response
    const lastMessage = messages[messages.length - 1];
    const responseText = `VendorB response to: "${lastMessage.content.substring(0, 50)}..."`;

    const response: VendorResponse = {
      choices: [
        {
          message: {
            content: responseText,
          },
        },
      ],
      usage: {
        input_tokens: Math.floor(Math.random() * 120) + 60,
        output_tokens: Math.floor(Math.random() * 180) + 60,
      },
    };

    return {
      success: true,
      response,
      latencyMs: Date.now() - startTime,
    };
  }
}

