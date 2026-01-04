import { Provider, SendMessageResponse } from "./types";
import {
  getAgentRepository,
  getMessageRepository,
  getUsageEventRepository,
  getProviderCallEventRepository,
  getIdempotencyKeyRepository,
} from "@/app/repositories";
import { MessageHistoryService } from "./services/message-history.service";
import { ProviderCallService } from "./services/provider-call.service";
import { ResponseNormalizerService } from "./services/response-normalizer.service";
import { IdempotencyService } from "./services/idempotency.service";
import { MessagePersistenceService } from "./services/message-persistence.service";
import { NotFoundError } from "./errors/api-error";

/**
 * Service for orchestrating the conversation flow between users and agents.
 * Handles idempotency, agent configuration retrieval, message history building,
 * provider calls with fallback, response normalization, and persistence.
 */
export class ConversationService {
  constructor(
    private agentRepository = getAgentRepository(),
    private messageRepository = getMessageRepository(),
    private messageHistoryService = new MessageHistoryService(getMessageRepository()),
    private providerCallService = new ProviderCallService(getProviderCallEventRepository()),
    private responseNormalizerService = new ResponseNormalizerService(),
    private idempotencyService = new IdempotencyService(getIdempotencyKeyRepository()),
    private messagePersistenceService = new MessagePersistenceService(
      getMessageRepository(),
      getUsageEventRepository()
    )
  ) {}

  /**
   * Processes a user message and returns an agent's response.
   * 
   * This method performs the following steps:
   * 1. Check for cached response using idempotency key.
   * 2. Retrieve agent configuration.
   * 3. Construct message history.
   * 4. Call primary provider (with fallback if configured).
   * 5. Normalize provider response.
   * 6. Persist conversation and usage data.
   * 7. Cache final response for future identical requests.
   * 
   * @param tenantId - The ID of the tenant
   * @param agentId - The ID of the agent
   * @param sessionId - The ID of the conversation session
   * @param userMessage - The text content of the user's message
   * @param idempotencyKey - Optional key to prevent duplicate processing
   * @returns A promise that resolves to a SendMessageResponse
   * @throws {NotFoundError} If the agent is not found
   * @throws {Error} If provider call fails or response normalization fails
   */
  async sendMessage(
    tenantId: string,
    agentId: string,
    sessionId: string,
    userMessage: string,
    idempotencyKey?: string
  ): Promise<SendMessageResponse> {
    // Check idempotency
    const cachedResponse = await this.idempotencyService.check<SendMessageResponse>(idempotencyKey, tenantId);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Get agent config
    const agent = await this.agentRepository.findById(agentId, tenantId);
    if (!agent) {
      throw new NotFoundError("Agent not found");
    }

    // Build message history
    const messageHistory = await this.messageHistoryService.buildHistory(
      sessionId,
      agent.systemPrompt,
      userMessage
    );

    // Call provider with fallback
    const providerCallResult = await this.providerCallService.callWithFallback({
      tenantId,
      agentId,
      sessionId,
      primaryProvider: agent.primaryProvider as Provider,
      fallbackProvider: agent.fallbackProvider as Provider | null,
      messageHistory,
      systemPrompt: agent.systemPrompt,
    });

    if (!providerCallResult.result.response) {
      throw new Error("Failed to get response from provider");
    }

    // Normalize response
    const normalized = this.responseNormalizerService.normalize(
      providerCallResult.result.response
    );

    // Persist messages and usage
    const { cost } = await this.messagePersistenceService.persist({
      sessionId,
      tenantId,
      agentId,
      userMessage,
      assistantMessage: normalized.text,
      provider: providerCallResult.usedProvider,
      normalizedResponse: normalized,
    });

    // Build response
    const response = {
      assistantMessage: normalized.text,
      provider: providerCallResult.usedProvider,
      tokensIn: normalized.tokensIn,
      tokensOut: normalized.tokensOut,
      cost,
      metadata: {
        latencyMs: providerCallResult.result.latencyMs,
        usedFallback: providerCallResult.usedFallback,
      },
    };

    // Store idempotency key if provided
    await this.idempotencyService.store(idempotencyKey, tenantId, response);

    return response;
  }
}

