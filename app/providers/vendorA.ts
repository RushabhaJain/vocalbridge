import { BaseProviderAdapter } from "./base";
import { ProviderCallResult, VendorResponse } from "@/app/lib/types";
import { logger } from "@/app/lib/logger";

/**
 * VendorA Provider Adapter
 * - Response format: { outputText, tokensIn, tokensOut, latencyMs }
 * - Failure behavior: ~10% HTTP 500, some slow requests
 */
export class VendorAAdapter extends BaseProviderAdapter {
  getName(): string {
    return "vendorA";
  }

  protected async callProvider(
    messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
    systemPrompt?: string
  ): Promise<ProviderCallResult> {
    const startTime = Date.now();

    // Simulate network latency (50ms - 2000ms)
    const latency = Math.random() * 1950 + 50;
    await this.sleep(Math.floor(latency));

    // ~10% chance of HTTP 500
    if (Math.random() < 0.1) {
      logger.warn("VendorA simulated HTTP 500 error");
      return {
        success: false,
        error: {
          code: "PROVIDER_ERROR",
          message: "Internal server error",
          statusCode: 500,
        },
        latencyMs: Date.now() - startTime,
      };
    }

    // Simulate occasional slow requests (5% chance of >2s latency)
    if (Math.random() < 0.05) {
      await this.sleep(2000);
    }

    // Generate mock response
    const lastMessage = messages[messages.length - 1];
    const responseText = `VendorA response to: "${lastMessage.content.substring(0, 50)}..."`;

    const response: VendorResponse = {
      outputText: responseText,
      tokensIn: Math.floor(Math.random() * 100) + 50,
      tokensOut: Math.floor(Math.random() * 150) + 50,
      latencyMs: Date.now() - startTime,
    };

    return {
      success: true,
      response,
      latencyMs: Date.now() - startTime,
    };
  }
}

