import { NextRequest } from "next/server";
import { POST, GET } from "@/app/api/agents/route";
import { authenticateRequest } from "@/app/lib/middleware";
import { getAgentRepository } from "@/app/repositories";
import { prisma } from "@/app/lib/prisma";

jest.mock("@/app/lib/middleware", () => ({
  authenticateRequest: jest.fn(),
}));

jest.mock("@/app/lib/prisma", () => ({
  prisma: {
    agent: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe("Agents API Route", () => {
  const tenantId = "t1";

  beforeEach(() => {
    jest.clearAllMocks();
    (authenticateRequest as jest.Mock).mockResolvedValue(tenantId);
  });

  describe("GET /api/agents", () => {
    it("should return agents for the authenticated tenant", async () => {
      const dbAgents = [
        { id: "1", name: "Agent 1", enabledTools: '[]' },
        { id: "2", name: "Agent 2", enabledTools: '["tool1"]' },
      ];
      (prisma.agent.findMany as jest.Mock).mockResolvedValue(dbAgents);

      const request = new NextRequest("http://localhost/api/agents");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(2);
      expect(data[1].enabledTools).toEqual(["tool1"]);
    });
  });

  describe("POST /api/agents", () => {
    it("should create a new agent with correctly serialized tools", async () => {
      const inputAgent = {
        name: "New Agent",
        primaryProvider: "vendorA",
        systemPrompt: "Helpful",
        enabledTools: ["voice", "chat"],
      };

      const dbResponse = {
        ...inputAgent,
        id: "new-id",
        tenantId,
        enabledTools: JSON.stringify(inputAgent.enabledTools),
        createdAt: new Date(),
      };
      (prisma.agent.create as jest.Mock).mockResolvedValue(dbResponse);

      const request = new NextRequest("http://localhost/api/agents", {
        method: "POST",
        body: JSON.stringify(inputAgent),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe("new-id");
      expect(data.enabledTools).toEqual(["voice", "chat"]);
      
      // Verify prisma received stringified tools
      expect(prisma.agent.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          enabledTools: '["voice","chat"]'
        })
      }));
    });

    it("should return validation error for invalid input", async () => {
      const request = new NextRequest("http://localhost/api/agents", {
        method: "POST",
        body: JSON.stringify({ name: "" }), // Missing required fields
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });
});
