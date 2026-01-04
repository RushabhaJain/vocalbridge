import { Agent, Session } from "@/app/lib/types";

export interface ITenantRepository {
  findById(id: string): Promise<{ id: string; name: string; apiKey: string } | null>;
  findByApiKey(apiKey: string): Promise<{ id: string; name: string; apiKey: string } | null>;
  create(data: { name: string; apiKey: string }): Promise<{ id: string; name: string; apiKey: string; createdAt: Date }>;
  findAll(): Promise<Array<{ id: string; name: string; createdAt: Date; _count: { agents: number; sessions: number } }>>;
}

export interface IAgentRepository {
  findById(id: string, tenantId: string): Promise<Agent | null>;
  findByTenant(tenantId: string): Promise<Agent[]>;
  create(data: {
    tenantId: string;
    name: string;
    primaryProvider: string;
    fallbackProvider: string | null;
    systemPrompt: string;
    enabledTools: string[];
  }): Promise<Agent>;
  update(id: string, tenantId: string, data: {
    name?: string;
    primaryProvider?: string;
    fallbackProvider?: string | null;
    systemPrompt?: string;
    enabledTools?: string[];
  }): Promise<Agent>;
}

export interface ISessionRepository {
  findById(id: string, tenantId: string): Promise<Session | null>;
  create(data: {
    tenantId: string;
    agentId: string;
    customerId: string;
  }): Promise<Session>;
  findWithMessages(id: string, tenantId: string): Promise<{
    id: string;
    agentId: string;
    customerId: string;
    createdAt: Date;
    updatedAt: Date;
    agent: {
      id: string;
      name: string;
      primaryProvider: string;
      fallbackProvider: string | null;
    };
    messages: Array<{
      id: string;
      role: string;
      content: string;
      createdAt: Date;
      metadata: string | null;
    }>;
  } | null>;
}

export interface IMessageRepository {
  findBySession(sessionId: string): Promise<Array<{
    id: string;
    role: string;
    content: string;
    createdAt: Date;
  }>>;
  create(data: {
    sessionId: string;
    role: string;
    content: string;
    metadata?: string;
  }): Promise<{
    id: string;
    role: string;
    content: string;
    createdAt: Date;
  }>;
}

export interface IUsageEventRepository {
  create(data: {
    tenantId: string;
    agentId: string;
    sessionId: string;
    provider: string;
    tokensIn: number;
    tokensOut: number;
    cost: number;
  }): Promise<{
    id: string;
    tenantId: string;
    agentId: string;
    sessionId: string;
    provider: string;
    tokensIn: number;
    tokensOut: number;
    cost: number;
    createdAt: Date;
  }>;
  findByTenantAndDateRange(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{
    id: string;
    agentId: string;
    sessionId: string;
    provider: string;
    tokensIn: number;
    tokensOut: number;
    cost: number;
    createdAt: Date;
    agent: {
      id: string;
      name: string;
    };
  }>>;
}

export interface IProviderCallEventRepository {
  create(data: {
    tenantId: string;
    agentId: string | null;
    sessionId: string | null;
    provider: string;
    success: boolean;
    statusCode: number | null;
    errorMessage: string | null;
    latencyMs: number | null;
  }): Promise<{
    id: string;
    createdAt: Date;
  }>;
}

export interface IIdempotencyKeyRepository {
  findByKey(key: string): Promise<{
    id: string;
    key: string;
    tenantId: string;
    response: string;
  } | null>;
  upsert(data: {
    key: string;
    tenantId: string;
    response: string;
  }): Promise<{
    id: string;
    key: string;
    tenantId: string;
    response: string;
  }>;
}

