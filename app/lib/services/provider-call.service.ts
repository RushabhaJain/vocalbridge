import { ProviderFactory } from "@/app/providers/factory";
import { Provider, ProviderCallResult, VendorResponse } from "../types";
import { logger } from "../logger";
import { IProviderCallEventRepository } from "@/app/repositories/interfaces";
import { MessageHistoryItem } from "./message-history.service";

export interface ProviderCallOptions {
  tenantId: string;
  agentId: string;
  sessionId: string;
  primaryProvider: Provider;
  fallbackProvider: Provider | null;
  messageHistory: MessageHistoryItem[];
  systemPrompt?: string;
}

export interface ProviderCallResponse {
  result: ProviderCallResult;
  usedProvider: Provider;
  usedFallback: boolean;
}

/**
 * Service for executing calls to AI providers with automatic fallback capabilities.
 * Manages the interaction with provider adapters and logs execution details.
 */
export class ProviderCallService {
  constructor(private providerCallEventRepository: IProviderCallEventRepository) {}

  /**
   * Executes a chat completion call with an optional fallback provider.
   * 
   * If the primary provider fails, this service will automatically attempt to
   * call the fallback provider if one is configured.
   * 
   * @param options - The call options including providers, history, and context
   * @returns A promise that resolves to the detailed provider call response
   * @throws {Error} If both primary and fallback providers fail to return a successful response
   */
  async callWithFallback(
    options: ProviderCallOptions
  ): Promise<ProviderCallResponse> {
    const {
      tenantId,
      agentId,
      sessionId,
      primaryProvider,
      fallbackProvider,
      messageHistory,
      systemPrompt,
    } = options;

    let result: ProviderCallResult | null = null;
    let usedProvider: Provider = primaryProvider;
    let usedFallback = false;

    // Try primary provider
    const primaryAdapter = ProviderFactory.getProvider(primaryProvider);
    result = await primaryAdapter.chat(messageHistory, systemPrompt);

    await this.logProviderCall(
      tenantId,
      agentId,
      sessionId,
      primaryProvider,
      result
    );

    // If primary failed and fallback exists, try fallback
    if (!result.success && fallbackProvider) {
      logger.info("Primary provider failed, attempting fallback", {
        primary: primaryProvider,
        fallback: fallbackProvider,
        tenantId,
        agentId,
      });

      const fallbackAdapter = ProviderFactory.getProvider(fallbackProvider);
      const fallbackResult = await fallbackAdapter.chat(messageHistory, systemPrompt);

      await this.logProviderCall(
        tenantId,
        agentId,
        sessionId,
        fallbackProvider,
        fallbackResult
      );

      if (fallbackResult.success) {
        result = fallbackResult;
        usedProvider = fallbackProvider;
        usedFallback = true;
      }
    }

    if (!result.success || !result.response) {
      throw new Error(
        result.error?.message || "Failed to get response from provider"
      );
    }

    return {
      result,
      usedProvider,
      usedFallback,
    };
  }

  private async logProviderCall(
    tenantId: string,
    agentId: string,
    sessionId: string,
    provider: Provider,
    result: ProviderCallResult
  ): Promise<void> {
    await this.providerCallEventRepository.create({
      tenantId,
      agentId,
      sessionId,
      provider,
      success: result.success,
      statusCode: result.error?.statusCode ?? null,
      errorMessage: result.error?.message ?? null,
      latencyMs: result.latencyMs ?? null,
    });
  }
}

