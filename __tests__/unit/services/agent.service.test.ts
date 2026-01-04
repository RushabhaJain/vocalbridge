import { AgentService } from "@/app/lib/services/agent.service";
import { IAgentRepository } from "@/app/repositories/interfaces";
import { NotFoundError } from "@/app/lib/errors/api-error";
import { Agent } from "@/app/lib/types";

describe("AgentService", () => {
  let agentService: AgentService;
  let mockAgentRepository: jest.Mocked<IAgentRepository>;

  beforeEach(() => {
    mockAgentRepository = {
      findById: jest.fn(),
      findByTenant: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    agentService = new AgentService(mockAgentRepository);
  });

  describe("createAgent", () => {
    it("should call agentRepository.create with correct parameters", async () => {
      const tenantId = "tenant-1";
      const data = {
        name: "Test Agent",
        primaryProvider: "vendorA",
        fallbackProvider: "vendorB",
        systemPrompt: "You are a helpful assistant",
        enabledTools: ["tool1"],
      };

      mockAgentRepository.create.mockResolvedValue({ 
        id: "agent-1", 
        ...data, 
        tenantId, 
        createdAt: new Date(),
        updatedAt: new Date()
      } as Agent);

      const result = await agentService.createAgent(tenantId, data);

      expect(mockAgentRepository.create).toHaveBeenCalledWith({
        tenantId,
        ...data,
      });
      expect(result.id).toBe("agent-1");
    });
  });

  describe("getAgents", () => {
    it("should call agentRepository.findByTenant and return results", async () => {
      const tenantId = "tenant-1";
      const mockAgents: Agent[] = [
        { 
          id: "agent-1", 
          name: "Agent 1", 
          tenantId,
          primaryProvider: "vendorA",
          fallbackProvider: null,
          systemPrompt: "prompt",
          enabledTools: [],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        { 
          id: "agent-2", 
          name: "Agent 2", 
          tenantId,
          primaryProvider: "vendorB",
          fallbackProvider: null,
          systemPrompt: "prompt",
          enabledTools: [],
          createdAt: new Date(),
          updatedAt: new Date()
        },
      ];

      mockAgentRepository.findByTenant.mockResolvedValue(mockAgents);

      const result = await agentService.getAgents(tenantId);

      expect(mockAgentRepository.findByTenant).toHaveBeenCalledWith(tenantId);
      expect(result).toEqual(mockAgents);
    });
  });

  describe("getAgentById", () => {
    it("should return agent when found", async () => {
      const tenantId = "tenant-1";
      const agentId = "agent-1";
      const mockAgent: Agent = { 
        id: agentId, 
        name: "Agent 1", 
        tenantId,
        primaryProvider: "vendorA",
        fallbackProvider: null,
        systemPrompt: "prompt",
        enabledTools: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockAgentRepository.findById.mockResolvedValue(mockAgent);

      const result = await agentService.getAgentById(agentId, tenantId);

      expect(mockAgentRepository.findById).toHaveBeenCalledWith(agentId, tenantId);
      expect(result).toEqual(mockAgent);
    });

    it("should throw NotFoundError when agent not found", async () => {
      const tenantId = "tenant-1";
      const agentId = "agent-1";

      mockAgentRepository.findById.mockResolvedValue(null);

      await expect(agentService.getAgentById(agentId, tenantId)).rejects.toThrow(NotFoundError);
    });
  });

  describe("updateAgent", () => {
    it("should call agentRepository.update with correct parameters", async () => {
      const tenantId = "tenant-1";
      const agentId = "agent-1";
      const updateData = { name: "Updated Name" };
      const mockUpdatedAgent: Agent = {
        id: agentId,
        tenantId,
        name: "Updated Name",
        primaryProvider: "vendorA",
        fallbackProvider: null,
        systemPrompt: "prompt",
        enabledTools: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockAgentRepository.update.mockResolvedValue(mockUpdatedAgent);

      const result = await agentService.updateAgent(agentId, tenantId, updateData);

      expect(mockAgentRepository.update).toHaveBeenCalledWith(agentId, tenantId, updateData);
      expect(result.name).toBe("Updated Name");
    });
  });
});
