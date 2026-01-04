import { prisma } from "@/app/lib/prisma";
import { IProviderCallEventRepository } from "./interfaces";

export class ProviderCallEventRepository implements IProviderCallEventRepository {
  async create(data: {
    tenantId: string;
    agentId: string | null;
    sessionId: string | null;
    provider: string;
    success: boolean;
    statusCode: number | null;
    errorMessage: string | null;
    latencyMs: number | null;
  }) {
    const event = await prisma.providerCallEvent.create({
      data,
      select: {
        id: true,
        createdAt: true,
      },
    });
    return event;
  }
}

