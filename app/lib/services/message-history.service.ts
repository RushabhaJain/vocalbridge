import { IMessageRepository } from "@/app/repositories/interfaces";

export interface MessageHistoryItem {
  role: "user" | "assistant" | "system";
  content: string;
}

/**
 * Service for constructing message history for AI provider calls.
 * Combines system prompts, historical messages, and current user input.
 */
export class MessageHistoryService {
  constructor(private messageRepository: IMessageRepository) {}

  /**
   * Builds an ordered array of message items for a provider's chat completion.
   * 
   * @param sessionId - The ID of the conversation session
   * @param systemPrompt - The system prompt to prepend (optional)
   * @param userMessage - The current user message to append
   * @returns A promise that resolves to an array of MessageHistoryItem
   */
  async buildHistory(
    sessionId: string,
    systemPrompt: string | null,
    userMessage: string
  ): Promise<MessageHistoryItem[]> {
    const messages = await this.messageRepository.findBySession(sessionId);

    const history: MessageHistoryItem[] = [];

    // Add system prompt if exists
    if (systemPrompt) {
      history.push({ role: "system", content: systemPrompt });
    }

    // Add existing messages
    for (const msg of messages) {
      history.push({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      });
    }

    // Add current user message
    history.push({ role: "user", content: userMessage });

    return history;
  }
}

