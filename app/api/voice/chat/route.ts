import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/app/lib/middleware";
import { voiceService } from "@/app/lib/services/voice.service";
import { logger } from "@/app/lib/logger";
import { handleError } from "@/app/lib/errors/error-handler";
import { NotFoundError } from "@/app/lib/errors/api-error";
import { withObservability } from "@/app/lib/observability/wrapper";
import { getSessionRepository } from "@/app/repositories";

/**
 * POST /api/voice/chat - Process voice input and return voice response
 * Expects multipart/form-data with:
 * - audio: Blob/File
 * - agentId: string
 * - sessionId: string
 * - idempotencyKey: string (optional)
 */
export const POST = withObservability(async function POST(request: NextRequest) {
  try {
    const tenantId = await authenticateRequest(request);
    const formData = await request.formData();

    const audio = formData.get("audio") as Blob | null;
    const agentId = formData.get("agentId") as string | null;
    const sessionId = formData.get("sessionId") as string | null;
    const idempotencyKey = (formData.get("idempotencyKey") as string | null) || undefined;

    if (!audio || !agentId || !sessionId) {
      return NextResponse.json(
        { error: "audio, agentId, and sessionId are required" },
        { status: 400 }
      );
    }

    // Verify session belongs to tenant
    const sessionRepository = getSessionRepository();
    const session = await sessionRepository.findById(sessionId, tenantId);

    if (!session) {
      throw new NotFoundError("Session not found");
    }

    if (session.agentId !== agentId) {
       return NextResponse.json(
        { error: "Agent ID mismatch for this session" },
        { status: 400 }
      );
    }

    // Convert Blob to Buffer
    const arrayBuffer = await audio.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    logger.info("Processing voice chat request", {
      tenantId,
      agentId,
      sessionId,
      audioSize: buffer.length,
    });

    const result = await voiceService.voiceChat({
      tenantId,
      agentId,
      sessionId,
      audioBuffer: buffer,
      idempotencyKey,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
});
