import { IMessageRepository, IUsageEventRepository } from "@/app/repositories/interfaces";
import { Provider } from "../types";
import { calculateCost } from "../pricing";
import { NormalizedResponse } from "./response-normalizer.service";

export interface PersistMessageOptions {
  sessionId: string;
  tenantId: string;
  agentId: string;
  userMessage: string;
  assistantMessage: string;
  provider: Provider;
  normalizedResponse: NormalizedResponse;
}

export interface PersistedMessageResult {
  cost: number;
}

/**
 * Service for persisting conversation messages and tracking usage.
 * Handles the storage of both user and assistant messages, calculates cost,
 * and records usage events for billing and analytics.
 */
export class MessagePersistenceService {
  constructor(
    private messageRepository: IMessageRepository,
    private usageEventRepository: IUsageEventRepository
  ) {}

  /**
   * Persists a pair of messages (user and assistant) and records the associated usage event.
   * 
   * @param options - The persistence options containing session, tenant, agent, and message data
   * @returns A promise that resolves to the result containing the calculated cost
   */
  async persist(options: PersistMessageOptions): Promise<PersistedMessageResult> {
    const {
      sessionId,
      tenantId,
      agentId,
      userMessage,
      assistantMessage,
      provider,
      normalizedResponse,
    } = options;

    // Calculate cost
    const cost = calculateCost(
      provider,
      normalizedResponse.tokensIn,
      normalizedResponse.tokensOut
    );

    // Save user message
    await this.messageRepository.create({
      sessionId,
      role: "user",
      content: userMessage,
    });

    // Save assistant message
    await this.messageRepository.create({
      sessionId,
      role: "assistant",
      content: assistantMessage,
      metadata: JSON.stringify({
        provider,
        tokensIn: normalizedResponse.tokensIn,
        tokensOut: normalizedResponse.tokensOut,
        cost,
      }),
    });

    // Save usage event
    await this.usageEventRepository.create({
      tenantId,
      agentId,
      sessionId,
      provider,
      tokensIn: normalizedResponse.tokensIn,
      tokensOut: normalizedResponse.tokensOut,
      cost,
    });

    return { cost };
  }
}

