import { NextResponse } from "next/server";

export interface AgentCreateInput {
  name?: string;
  primaryProvider?: string;
  fallbackProvider?: string;
  systemPrompt?: string;
  enabledTools?: string[];
}

export interface AgentUpdateInput {
  name?: string;
  primaryProvider?: string;
  fallbackProvider?: string | null;
  systemPrompt?: string;
  enabledTools?: string[];
}

export function validateAgentCreate(body: AgentCreateInput): { valid: boolean; error?: NextResponse } {
  if (!body.name || !body.primaryProvider || !body.systemPrompt) {
    return {
      valid: false,
      error: NextResponse.json(
        { error: "name, primaryProvider, and systemPrompt are required" },
        { status: 400 }
      ),
    };
  }

  if (body.primaryProvider !== "vendorA" && body.primaryProvider !== "vendorB") {
    return {
      valid: false,
      error: NextResponse.json(
        { error: "primaryProvider must be 'vendorA' or 'vendorB'" },
        { status: 400 }
      ),
    };
  }

  if (body.fallbackProvider && body.fallbackProvider !== "vendorA" && body.fallbackProvider !== "vendorB") {
    return {
      valid: false,
      error: NextResponse.json(
        { error: "fallbackProvider must be 'vendorA' or 'vendorB'" },
        { status: 400 }
      ),
    };
  }

  return { valid: true };
}

export function validateAgentUpdate(body: AgentUpdateInput): { valid: boolean; error?: NextResponse } {
  if (body.primaryProvider !== undefined) {
    if (body.primaryProvider !== "vendorA" && body.primaryProvider !== "vendorB") {
      return {
        valid: false,
        error: NextResponse.json(
          { error: "primaryProvider must be 'vendorA' or 'vendorB'" },
          { status: 400 }
        ),
      };
    }
  }

  if (body.fallbackProvider !== undefined) {
    if (body.fallbackProvider !== null && body.fallbackProvider !== "vendorA" && body.fallbackProvider !== "vendorB") {
      return {
        valid: false,
        error: NextResponse.json(
          { error: "fallbackProvider must be 'vendorA', 'vendorB', or null" },
          { status: 400 }
        ),
      };
    }
  }

  return { valid: true };
}

