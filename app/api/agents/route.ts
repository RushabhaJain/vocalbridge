import { NextRequest, NextResponse } from "next/server";
import { getAgentRepository } from "@/app/repositories";
import { AgentService } from "@/app/lib/services";
import { authenticateRequest } from "@/app/lib/middleware";
import { logger } from "@/app/lib/logger";
import { validateAgentCreate } from "@/app/lib/validators/agent.validator";
import { handleError } from "@/app/lib/errors/error-handler";
import { withObservability } from "@/app/lib/observability/wrapper";

/**
 * POST /api/agents - Create a new agent
 */
export const POST = withObservability(async function POST(request: NextRequest) {
  try {
    const tenantId = await authenticateRequest(request);
    const body = await request.json();

    const validation = validateAgentCreate(body);
    if (!validation.valid) {
      return validation.error!;
    }

    const { name, primaryProvider, fallbackProvider, systemPrompt, enabledTools } = body;

    const agentService = new AgentService(getAgentRepository());
    const agent = await agentService.createAgent(tenantId, {
      name,
      primaryProvider,
      fallbackProvider: fallbackProvider || null,
      systemPrompt,
      enabledTools: enabledTools || [],
    });

    logger.info("Agent created", { agentId: agent.id, tenantId, name });

    return NextResponse.json(agent);
  } catch (error) {
    return handleError(error);
  }
});

/**
 * GET /api/agents - List all agents for the tenant
 */
export const GET = withObservability(async function GET(request: NextRequest) {
  try {
    const tenantId = await authenticateRequest(request);

    const agentService = new AgentService(getAgentRepository());
    const agents = await agentService.getAgents(tenantId);

    return NextResponse.json(agents);
  } catch (error) {
    return handleError(error);
  }
});

