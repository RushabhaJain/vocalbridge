import { NextResponse } from "next/server";

export interface SessionCreateInput {
  agentId?: string;
  customerId?: string;
}

export function validateSessionCreate(body: SessionCreateInput): { valid: boolean; error?: NextResponse } {
  if (!body.agentId || !body.customerId) {
    return {
      valid: false,
      error: NextResponse.json(
        { error: "agentId and customerId are required" },
        { status: 400 }
      ),
    };
  }

  return { valid: true };
}

