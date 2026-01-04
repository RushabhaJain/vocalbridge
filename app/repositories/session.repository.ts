import { prisma } from "@/app/lib/prisma";
import { ISessionRepository } from "./interfaces";
import { Session } from "@/app/lib/types";

/**
 * Repository for managing Session and Message data persistence.
 * Provides methods for creating and retrieving conversation sessions and their history.
 */
export class SessionRepository implements ISessionRepository {
  async findById(id: string, tenantId: string): Promise<Session | null> {
    const session = await prisma.session.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        tenantId: true,
        agentId: true,
        customerId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return session;
  }

  async create(data: {
    tenantId: string;
    agentId: string;
    customerId: string;
  }): Promise<Session> {
    const session = await prisma.session.create({
      data,
      select: {
        id: true,
        tenantId: true,
        agentId: true,
        customerId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return session;
  }

  async findWithMessages(id: string, tenantId: string) {
    const session = await prisma.session.findFirst({
      where: { id, tenantId },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            primaryProvider: true,
            fallbackProvider: true,
          },
        },
        messages: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            role: true,
            content: true,
            createdAt: true,
            metadata: true,
          },
        },
      },
    });

    if (!session) {
      return null;
    }

    return {
      id: session.id,
      agentId: session.agentId,
      customerId: session.customerId,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      agent: {
        id: session.agent.id,
        name: session.agent.name,
        primaryProvider: session.agent.primaryProvider,
        fallbackProvider: session.agent.fallbackProvider,
      },
      messages: session.messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt,
        metadata: msg.metadata,
      })),
    };
  }
}

