/**
 * Integration test: Message -> Usage Billed
 * 
 * This test verifies the end-to-end flow:
 * 1. Create a tenant and agent
 * 2. Create a session
 * 3. Send a message
 * 4. Verify usage event was created with correct cost
 */

import { prisma } from "@/app/lib/prisma";
import { ConversationService } from "@/app/lib/conversation-service";
import { calculateCost } from "@/app/lib/pricing";
import crypto from "crypto";

describe("Message -> Usage Billed Integration", () => {
  let tenantId: string;
  let agentId: string;
  let sessionId: string;

  beforeAll(async () => {
    // Create test tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: "Test Tenant",
        apiKey: "sk_test_" + crypto.randomBytes(32).toString("hex"),
      },
    });
    tenantId = tenant.id;

    // Create test agent
    const agent = await prisma.agent.create({
      data: {
        tenantId,
        name: "Test Agent",
        primaryProvider: "vendorA",
        fallbackProvider: null,
        systemPrompt: "You are a test assistant.",
        enabledTools: JSON.stringify([]),
      },
    });
    agentId = agent.id;

    // Create test session
    const session = await prisma.session.create({
      data: {
        tenantId,
        agentId,
        customerId: "test-customer",
      },
    });
    sessionId = session.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.message.deleteMany({ where: { sessionId } });
    await prisma.usageEvent.deleteMany({ where: { sessionId } });
    await prisma.providerCallEvent.deleteMany({ where: { sessionId } });
    await prisma.session.delete({ where: { id: sessionId } });
    await prisma.agent.delete({ where: { id: agentId } });
    await prisma.tenant.delete({ where: { id: tenantId } });
    await prisma.$disconnect();
  });

  afterEach(async () => {
    // Clear events between tests to ensure isolation
    await prisma.usageEvent.deleteMany({ where: { sessionId } });
    await prisma.message.deleteMany({ where: { sessionId } });
    await prisma.providerCallEvent.deleteMany({ where: { sessionId } });
  });

  it("should create usage event with correct cost when message is sent", async () => {
    const conversationService = new ConversationService();
    const userMessage = "Hello, this is a test message";

    // Send message
    const result = await conversationService.sendMessage(
      tenantId,
      agentId,
      sessionId,
      userMessage
    );

    // Verify response
    expect(result.assistantMessage).toBeDefined();
    expect(result.provider).toBe("vendorA");
    expect(result.tokensIn).toBeGreaterThan(0);
    expect(result.tokensOut).toBeGreaterThan(0);
    expect(result.cost).toBeGreaterThan(0);

    // Verify usage event was created
    const usageEvents = await prisma.usageEvent.findMany({
      where: {
        tenantId,
        agentId,
        sessionId,
      },
      orderBy: { createdAt: "desc" },
      take: 1,
    });

    expect(usageEvents.length).toBeGreaterThan(0);
    const usageEvent = usageEvents[0];

    expect(usageEvent.tenantId).toBe(tenantId);
    expect(usageEvent.agentId).toBe(agentId);
    expect(usageEvent.sessionId).toBe(sessionId);
    expect(usageEvent.provider).toBe(result.provider);
    expect(usageEvent.tokensIn).toBe(result.tokensIn);
    expect(usageEvent.tokensOut).toBe(result.tokensOut);

    // Verify cost calculation
    const expectedCost = calculateCost(
      result.provider as "vendorA" | "vendorB",
      result.tokensIn,
      result.tokensOut
    );
    expect(usageEvent.cost).toBeCloseTo(expectedCost, 6);
    expect(usageEvent.cost).toBeCloseTo(result.cost, 6);
  }, 30000);

  it("should handle idempotency correctly", async () => {
    const conversationService = new ConversationService();
    const userMessage = "Idempotent test message";
    const idempotencyKey = `test-${Date.now()}-${Math.random()}`;

    // Send message first time
    const result1 = await conversationService.sendMessage(
      tenantId,
      agentId,
      sessionId,
      userMessage,
      idempotencyKey
    );

    // Send same message with same idempotency key
    const result2 = await conversationService.sendMessage(
      tenantId,
      agentId,
      sessionId,
      userMessage,
      idempotencyKey
    );

    // Results should be identical
    expect(result1.assistantMessage).toBe(result2.assistantMessage);
    expect(result1.cost).toBe(result2.cost);

    // Should only have one usage event (not two)
    const usageEvents = await prisma.usageEvent.findMany({
      where: {
        tenantId,
        agentId,
        sessionId,
        createdAt: {
          gte: new Date(Date.now() - 60000), // Last minute
        },
      },
    });

    // Count events for this specific message
    const recentEvents = usageEvents.filter(
      (e: { cost: number }) => Math.abs(e.cost - result1.cost) < 0.0001
    );
    expect(recentEvents.length).toBe(1);
  }, 30000);
});

