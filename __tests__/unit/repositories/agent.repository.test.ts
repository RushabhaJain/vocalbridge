import { AgentRepository } from "@/app/repositories/agent.repository";
import { prisma } from "@/app/lib/prisma";

jest.mock("@/app/lib/prisma", () => ({
  prisma: {
    agent: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe("AgentRepository", () => {
  let repository: AgentRepository;

  beforeEach(() => {
    repository = new AgentRepository();
    jest.clearAllMocks();
  });

  describe("findById", () => {
    it("should return parsed agent when found", async () => {
      const dbAgent = {
        id: "1",
        tenantId: "t1",
        name: "Test",
        enabledTools: '["tool1", "tool2"]',
      };
      (prisma.agent.findFirst as jest.Mock).mockResolvedValue(dbAgent);

      const result = await repository.findById("1", "t1");

      expect(result).toEqual({
        ...dbAgent,
        enabledTools: ["tool1", "tool2"],
      });
      expect(prisma.agent.findFirst).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: "1", tenantId: "t1" }
      }));
    });

    it("should return null when not found", async () => {
      (prisma.agent.findFirst as jest.Mock).mockResolvedValue(null);
      const result = await repository.findById("1", "t1");
      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("should stringify enabledTools before saving", async () => {
      const input = {
        tenantId: "t1",
        name: "Test",
        primaryProvider: "P1",
        fallbackProvider: null,
        systemPrompt: "S1",
        enabledTools: ["tool1"],
      };
      
      const dbResponse = {
        ...input,
        id: "new-id",
        enabledTools: '["tool1"]',
        createdAt: new Date(),
      };
      (prisma.agent.create as jest.Mock).mockResolvedValue(dbResponse);

      const result = await repository.create(input);

      expect(prisma.agent.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          enabledTools: '["tool1"]'
        })
      }));
      expect(result.enabledTools).toEqual(["tool1"]);
    });
  });

  describe("update", () => {
    it("should stringify enabledTools if provided in update", async () => {
      (prisma.agent.findFirst as jest.Mock).mockResolvedValue({ id: "1", tenantId: "t1" });
      (prisma.agent.update as jest.Mock).mockResolvedValue({
        id: "1",
        tenantId: "t1",
        enabledTools: '["new-tool"]',
      });

      const result = await repository.update("1", "t1", { enabledTools: ["new-tool"] });

      expect(prisma.agent.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          enabledTools: '["new-tool"]'
        })
      }));
      expect(result.enabledTools).toEqual(["new-tool"]);
    });
  });
});
