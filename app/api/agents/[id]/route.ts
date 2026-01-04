import { NextRequest, NextResponse } from "next/server";
import { getAgentRepository } from "@/app/repositories";
import { AgentService } from "@/app/lib/services";
import { authenticateRequest } from "@/app/lib/middleware";
import { logger } from "@/app/lib/logger";
import { validateAgentUpdate } from "@/app/lib/validators/agent.validator";
import { handleError } from "@/app/lib/errors/error-handler";

/**
 * GET /api/agents/:id - Get agent details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await authenticateRequest(request);
    const { id } = await params;

    const agentService = new AgentService(getAgentRepository());
    const agent = await agentService.getAgentById(id, tenantId);

    return NextResponse.json(agent);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * PUT /api/agents/:id - Update agent
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await authenticateRequest(request);
    const { id } = await params;
    const body = await request.json();

    const validation = validateAgentUpdate(body);
    if (!validation.valid) {
      return validation.error!;
    }

    const agentService = new AgentService(getAgentRepository());
    
    const updateData: {
      name?: string;
      primaryProvider?: string;
      fallbackProvider?: string | null;
      systemPrompt?: string;
      enabledTools?: string[];
    } = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.primaryProvider !== undefined) updateData.primaryProvider = body.primaryProvider;
    if (body.fallbackProvider !== undefined) updateData.fallbackProvider = body.fallbackProvider;
    if (body.systemPrompt !== undefined) updateData.systemPrompt = body.systemPrompt;
    if (body.enabledTools !== undefined) updateData.enabledTools = body.enabledTools;

    const agent = await agentService.updateAgent(id, tenantId, updateData);

    logger.info("Agent updated", { agentId: id, tenantId });

    return NextResponse.json(agent);
  } catch (error) {
    return handleError(error);
  }
}

