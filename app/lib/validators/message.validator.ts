import { NextResponse } from "next/server";

export interface MessageSendInput {
  sessionId?: string;
  message?: string;
  idempotencyKey?: string;
}

export function validateMessageSend(body: MessageSendInput): { valid: boolean; error?: NextResponse } {
  if (!body.sessionId || !body.message) {
    return {
      valid: false,
      error: NextResponse.json(
        { error: "sessionId and message are required" },
        { status: 400 }
      ),
    };
  }

  return { valid: true };
}

