import { prisma } from "@/app/lib/prisma";
import { IUsageEventRepository } from "./interfaces";

export class UsageEventRepository implements IUsageEventRepository {
  async create(data: {
    tenantId: string;
    agentId: string;
    sessionId: string;
    provider: string;
    tokensIn: number;
    tokensOut: number;
    cost: number;
  }) {
    const usageEvent = await prisma.usageEvent.create({
      data,
      select: {
        id: true,
        tenantId: true,
        agentId: true,
        sessionId: true,
        provider: true,
        tokensIn: true,
        tokensOut: true,
        cost: true,
        createdAt: true,
      },
    });
    return usageEvent;
  }

  async findByTenantAndDateRange(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ) {
    const usageEvents = await prisma.usageEvent.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return usageEvents.map((event) => ({
      id: event.id,
      agentId: event.agentId,
      sessionId: event.sessionId,
      provider: event.provider,
      tokensIn: event.tokensIn,
      tokensOut: event.tokensOut,
      cost: event.cost,
      createdAt: event.createdAt,
      agent: {
        id: event.agent.id,
        name: event.agent.name,
      },
    }));
  }
}

