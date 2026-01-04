import { ConversationService } from "@/app/lib/conversation-service";
import { Provider } from "@/app/lib/types";
import { NotFoundError } from "@/app/lib/errors/api-error";
import { 
  IAgentRepository, 
  IMessageRepository, 
  IUsageEventRepository, 
  IProviderCallEventRepository, 
  IIdempotencyKeyRepository 
} from "@/app/repositories/interfaces";

describe("ConversationService", () => {
  let conversationService: ConversationService;
  let mockAgentRepository: jest.Mocked<IAgentRepository>;
  let mockMessageRepository: jest.Mocked<IMessageRepository>;
  let mockMessageHistoryService: any; // Internal service, maybe just any for now or mock explicitly
  let mockProviderCallService: any;
  let mockResponseNormalizerService: any;
  let mockIdempotencyService: any;
  let mockMessagePersistenceService: any;

  beforeEach(() => {
    mockAgentRepository = { 
      findById: jest.fn(),
      findByTenant: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    } as any;
    
    mockMessageRepository = { 
      findBySession: jest.fn(), 
      create: jest.fn() 
    } as any;
    
    mockMessageHistoryService = { buildHistory: jest.fn() };
    mockProviderCallService = { callWithFallback: jest.fn() };
    mockResponseNormalizerService = { normalize: jest.fn() };
    mockIdempotencyService = { check: jest.fn(), store: jest.fn() };
    mockMessagePersistenceService = { persist: jest.fn() };

    conversationService = new ConversationService(
      mockAgentRepository,
      mockMessageRepository,
      mockMessageHistoryService,
      mockProviderCallService,
      mockResponseNormalizerService,
      mockIdempotencyService,
      mockMessagePersistenceService
    );
  });

  it("should return cached response if idempotency check hits", async () => {
    const cached = { assistantMessage: "cached" };
    mockIdempotencyService.check.mockResolvedValue(cached);

    const result = await conversationService.sendMessage("t1", "a1", "s1", "hi", "key1");

    expect(result).toEqual(cached);
    expect(mockAgentRepository.findById).not.toHaveBeenCalled();
  });

  it("should throw NotFoundError if agent does not exist", async () => {
    mockIdempotencyService.check.mockResolvedValue(null);
    mockAgentRepository.findById.mockResolvedValue(null);

    await expect(
      conversationService.sendMessage("t1", "a1", "s1", "hi")
    ).rejects.toThrow(NotFoundError);
  });

  it("should orchestrate the full message flow successfully", async () => {
    const tenantId = "t1";
    const agentId = "a1";
    const sessionId = "s1";
    const userMessage = "hi";
    const agent: any = { 
      id: agentId, 
      tenantId,
      name: "Test Agent",
      primaryProvider: "vendorA", 
      fallbackProvider: "vendorB",
      systemPrompt: "system", 
      enabledTools: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const history = [{ role: "user", content: userMessage }];
    const providerResponse = { outputText: "hello", tokensIn: 10, tokensOut: 20 };
    const providerCallResult = {
      usedProvider: "vendorA",
      usedFallback: false,
      result: {
        success: true,
        response: providerResponse,
        latencyMs: 100,
      }
    };
    const normalized = { text: "hello", tokensIn: 10, tokensOut: 20 };

    mockIdempotencyService.check.mockResolvedValue(null);
    mockAgentRepository.findById.mockResolvedValue(agent);
    mockMessageHistoryService.buildHistory.mockResolvedValue(history);
    mockProviderCallService.callWithFallback.mockResolvedValue(providerCallResult);
    mockResponseNormalizerService.normalize.mockReturnValue(normalized);
    mockMessagePersistenceService.persist.mockResolvedValue({ cost: 0.001 });

    const result = await conversationService.sendMessage(tenantId, agentId, sessionId, userMessage);

    expect(result).toEqual({
      assistantMessage: "hello",
      provider: "vendorA",
      tokensIn: 10,
      tokensOut: 20,
      cost: 0.001,
      metadata: {
        latencyMs: 100,
        usedFallback: false,
      },
    });

    expect(mockMessageHistoryService.buildHistory).toHaveBeenCalledWith(sessionId, agent.systemPrompt, userMessage);
    expect(mockProviderCallService.callWithFallback).toHaveBeenCalledWith({
      tenantId,
      agentId,
      sessionId,
      primaryProvider: agent.primaryProvider,
      fallbackProvider: agent.fallbackProvider,
      messageHistory: history,
      systemPrompt: agent.systemPrompt,
    });
    expect(mockMessagePersistenceService.persist).toHaveBeenCalled();
    expect(mockIdempotencyService.store).toHaveBeenCalled();
  });
});
