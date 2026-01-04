import { NextRequest, NextResponse } from "next/server";
import { getAgentRepository, getSessionRepository } from "@/app/repositories";
import { authenticateRequest } from "@/app/lib/middleware";
import { logger } from "@/app/lib/logger";
import { validateSessionCreate } from "@/app/lib/validators/session.validator";
import { handleError } from "@/app/lib/errors/error-handler";
import { NotFoundError } from "@/app/lib/errors/api-error";
import { withObservability } from "@/app/lib/observability/wrapper";

/**
 * POST /api/sessions - Create a new conversation session
 */
export const POST = withObservability(async function POST(request: NextRequest) {
  try {
    const tenantId = await authenticateRequest(request);
    const body = await request.json();

    const validation = validateSessionCreate(body);
    if (!validation.valid) {
      return validation.error!;
    }

    const { agentId, customerId } = body;

    // Verify agent belongs to tenant
    const agentRepository = getAgentRepository();
    const agent = await agentRepository.findById(agentId, tenantId);

    if (!agent) {
      throw new NotFoundError("Agent not found");
    }

    const sessionRepository = getSessionRepository();
    const session = await sessionRepository.create({
      tenantId,
      agentId,
      customerId: String(customerId),
    });

    logger.info("Session created", { sessionId: session.id, tenantId, agentId });

    return NextResponse.json({
      sessionId: session.id,
      agent: {
        id: agent.id,
        name: agent.name,
        primaryProvider: agent.primaryProvider,
        fallbackProvider: agent.fallbackProvider,
      },
      customerId: session.customerId,
      createdAt: session.createdAt,
    });
  } catch (error) {
    return handleError(error);
  }
});

/**
 * GET /api/sessions/:sessionId - Get session details
 */
export const GET = withObservability(async function GET(request: NextRequest) {
  try {
    const tenantId = await authenticateRequest(request);
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    const sessionRepository = getSessionRepository();
    const session = await sessionRepository.findWithMessages(sessionId, tenantId);

    if (!session) {
      throw new NotFoundError("Session not found");
    }

    return NextResponse.json({
      sessionId: session.id,
      agent: session.agent,
      customerId: session.customerId,
      messages: session.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.createdAt,
        metadata: msg.metadata ? JSON.parse(msg.metadata) : null,
      })),
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    });
  } catch (error) {
    return handleError(error);
  }
});

