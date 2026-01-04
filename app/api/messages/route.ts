import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/app/lib/middleware";
import { ConversationService } from "@/app/lib/conversation-service";
import { logger } from "@/app/lib/logger";
import { validateMessageSend } from "@/app/lib/validators/message.validator";
import { handleError } from "@/app/lib/errors/error-handler";
import { NotFoundError } from "@/app/lib/errors/api-error";
import { withObservability } from "@/app/lib/observability/wrapper";

/**
 * POST /api/messages - Send a message to a session
 */
export const POST = withObservability(async function POST(request: NextRequest) {
  try {
    const tenantId = await authenticateRequest(request);
    const body = await request.json();

    const validation = validateMessageSend(body);
    if (!validation.valid) {
      return validation.error!;
    }

    const { sessionId, message, idempotencyKey } = body;

    // Verify session belongs to tenant
    const { getSessionRepository } = await import("@/app/repositories");
    const sessionRepository = getSessionRepository();
    const session = await sessionRepository.findById(sessionId, tenantId);

    if (!session) {
      throw new NotFoundError("Session not found");
    }

    const conversationService = new ConversationService();
    const result = await conversationService.sendMessage(
      tenantId,
      session.agentId,
      sessionId,
      message,
      idempotencyKey
    );

    logger.info("Message sent successfully", {
      sessionId,
      tenantId,
      provider: result.provider,
      cost: result.cost,
    });

    return NextResponse.json({
      assistantMessage: result.assistantMessage,
      provider: result.provider,
      tokensIn: result.tokensIn,
      tokensOut: result.tokensOut,
      cost: result.cost,
      metadata: result.metadata,
    });
  } catch (error) {
    return handleError(error);
  }
});

