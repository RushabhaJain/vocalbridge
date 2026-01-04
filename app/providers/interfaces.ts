import { ProviderCallResult, VendorResponse } from "@/app/lib/types";

export interface IProviderAdapter {
  /**
   * Send a chat message to the provider
   */
  chat(
    messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
    systemPrompt?: string
  ): Promise<ProviderCallResult>;

  /**
   * Get the provider name
   */
  getName(): string;
}

export interface ProviderConfig {
  timeoutMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
}

