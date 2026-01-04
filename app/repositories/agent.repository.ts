import { prisma } from "@/app/lib/prisma";
import { IAgentRepository } from "./interfaces";
import { Agent } from "@/app/lib/types";

/**
 * Repository for managing Agent data persistence using Prisma.
 * Handles mapping between database records and domain types.
 */
export class AgentRepository implements IAgentRepository {
  /**
   * Maps a raw database agent object to the domain Agent type.
   * Parses the stringified enabledTools field back into an array.
   * 
   * @param agent - The raw database record or null
   * @returns The domain Agent object or null
   */
  private mapAgent(agent: {
    id: string;
    tenantId: string;
    name: string;
    primaryProvider: string;
    fallbackProvider: string | null;
    systemPrompt: string;
    enabledTools: any;
    createdAt: Date;
    updatedAt: Date;
  } | null): Agent | null {
    if (!agent) return null;
    return {
      ...agent,
      enabledTools: typeof agent.enabledTools === "string" 
        ? JSON.parse(agent.enabledTools) 
        : agent.enabledTools,
    } as Agent;
  }

  async findById(id: string, tenantId: string): Promise<Agent | null> {
    const agent = await prisma.agent.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        tenantId: true,
        name: true,
        primaryProvider: true,
        fallbackProvider: true,
        systemPrompt: true,
        enabledTools: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return this.mapAgent(agent);
  }

  async findByTenant(tenantId: string): Promise<Agent[]> {
    const agents = await prisma.agent.findMany({
      where: { tenantId },
      select: {
        id: true,
        tenantId: true,
        name: true,
        primaryProvider: true,
        fallbackProvider: true,
        systemPrompt: true,
        enabledTools: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return agents.map((agent) => this.mapAgent(agent)!);
  }

  async create(data: {
    tenantId: string;
    name: string;
    primaryProvider: string;
    fallbackProvider: string | null;
    systemPrompt: string;
    enabledTools: string[];
  }): Promise<Agent> {
    const agent = await prisma.agent.create({
      data: {
        ...data,
        enabledTools: JSON.stringify(data.enabledTools),
      },
      select: {
        id: true,
        tenantId: true,
        name: true,
        primaryProvider: true,
        fallbackProvider: true,
        systemPrompt: true,
        enabledTools: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return this.mapAgent(agent)!;
  }

  async update(
    id: string,
    tenantId: string,
    data: {
      name?: string;
      primaryProvider?: string;
      fallbackProvider?: string | null;
      systemPrompt?: string;
      enabledTools?: string[];
    }
  ): Promise<Agent> {
    // Verify agent belongs to tenant
    const existing = await prisma.agent.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new Error("Agent not found");
    }

    const agent = await prisma.agent.update({
      where: { id },
      data: {
        ...data,
        enabledTools: data.enabledTools ? JSON.stringify(data.enabledTools) : undefined,
      },
      select: {
        id: true,
        tenantId: true,
        name: true,
        primaryProvider: true,
        fallbackProvider: true,
        systemPrompt: true,
        enabledTools: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return this.mapAgent(agent)!;
  }
}

