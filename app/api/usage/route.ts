import { NextRequest, NextResponse } from "next/server";
import { getUsageEventRepository } from "@/app/repositories";
import { authenticateRequest } from "@/app/lib/middleware";
import { logger } from "@/app/lib/logger";
import { handleError } from "@/app/lib/errors/error-handler";
import { withObservability } from "@/app/lib/observability/wrapper";

/**
 * GET /api/usage - Get usage and cost rollups for a tenant
 */
export const GET = withObservability(async function GET(request: NextRequest) {
  try {
    const tenantId = await authenticateRequest(request);
    const { searchParams } = new URL(request.url);
    
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days
    const end = endDate ? new Date(endDate) : new Date();

    // Get all usage events for the tenant in date range
    const usageEventRepository = getUsageEventRepository();
    const usageEvents = await usageEventRepository.findByTenantAndDateRange(
      tenantId,
      start,
      end
    );

    // Calculate totals
    const totals = {
      sessions: new Set(usageEvents.map((e) => e.sessionId)).size,
      tokensIn: usageEvents.reduce((sum, e) => sum + e.tokensIn, 0),
      tokensOut: usageEvents.reduce((sum, e) => sum + e.tokensOut, 0),
      totalCost: usageEvents.reduce((sum, e) => sum + e.cost, 0),
    };

    // Breakdown by provider
    const byProvider = usageEvents.reduce(
      (acc, event) => {
        if (!acc[event.provider]) {
          acc[event.provider] = {
            sessions: new Set<string>(),
            tokensIn: 0,
            tokensOut: 0,
            cost: 0,
          };
        }
        acc[event.provider].sessions.add(event.sessionId);
        acc[event.provider].tokensIn += event.tokensIn;
        acc[event.provider].tokensOut += event.tokensOut;
        acc[event.provider].cost += event.cost;
        return acc;
      },
      {} as Record<string, { sessions: Set<string>; tokensIn: number; tokensOut: number; cost: number }>
    );

    // Convert to array format expected by frontend
    const providerBreakdown = Object.entries(byProvider).map(([provider, data]) => ({
      provider,
      sessions: data.sessions.size,
      tokensIn: data.tokensIn,
      tokensOut: data.tokensOut,
      totalTokens: data.tokensIn + data.tokensOut,
      cost: data.cost,
    }));

    // Top agents by cost
    const byAgent = usageEvents.reduce(
      (acc, event) => {
        const agentId = event.agentId;
        if (!acc[agentId]) {
          acc[agentId] = {
            agentId,
            agentName: event.agent.name,
            sessions: new Set<string>(),
            tokensIn: 0,
            tokensOut: 0,
            cost: 0,
          };
        }
        acc[agentId].sessions.add(event.sessionId);
        acc[agentId].tokensIn += event.tokensIn;
        acc[agentId].tokensOut += event.tokensOut;
        acc[agentId].cost += event.cost;
        return acc;
      },
      {} as Record<
        string,
        {
          agentId: string;
          agentName: string;
          sessions: Set<string>;
          tokensIn: number;
          tokensOut: number;
          cost: number;
        }
      >
    );

    const topAgents = Object.values(byAgent)
      .map((agent) => ({
        agentId: agent.agentId,
        agentName: agent.agentName,
        sessions: agent.sessions.size,
        totalTokens: agent.tokensIn + agent.tokensOut,
        cost: agent.cost,
      }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10);

    logger.info("Usage analytics fetched", {
      tenantId,
      dateRange: { start, end },
      totalCost: totals.totalCost,
    });

    return NextResponse.json({
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      totals,
      totalCost: totals.totalCost,
      providerBreakdown,
      topAgents,
    });
  } catch (error) {
    return handleError(error);
  }
});

