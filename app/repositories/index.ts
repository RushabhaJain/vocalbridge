/**
 * Repository factory - provides singleton instances of repositories
 * Following Dependency Injection pattern
 */

import { TenantRepository } from "./tenant.repository";
import { AgentRepository } from "./agent.repository";
import { SessionRepository } from "./session.repository";
import { MessageRepository } from "./message.repository";
import { UsageEventRepository } from "./usage-event.repository";
import { ProviderCallEventRepository } from "./provider-call-event.repository";
import { IdempotencyKeyRepository } from "./idempotency-key.repository";

import {
  ITenantRepository,
  IAgentRepository,
  ISessionRepository,
  IMessageRepository,
  IUsageEventRepository,
  IProviderCallEventRepository,
  IIdempotencyKeyRepository,
} from "./interfaces";

// Singleton instances
let tenantRepository: ITenantRepository | null = null;
let agentRepository: IAgentRepository | null = null;
let sessionRepository: ISessionRepository | null = null;
let messageRepository: IMessageRepository | null = null;
let usageEventRepository: IUsageEventRepository | null = null;
let providerCallEventRepository: IProviderCallEventRepository | null = null;
let idempotencyKeyRepository: IIdempotencyKeyRepository | null = null;

export const getTenantRepository = (): ITenantRepository => {
  if (!tenantRepository) {
    tenantRepository = new TenantRepository();
  }
  return tenantRepository;
};

export const getAgentRepository = (): IAgentRepository => {
  if (!agentRepository) {
    agentRepository = new AgentRepository();
  }
  return agentRepository;
};

export const getSessionRepository = (): ISessionRepository => {
  if (!sessionRepository) {
    sessionRepository = new SessionRepository();
  }
  return sessionRepository;
};

export const getMessageRepository = (): IMessageRepository => {
  if (!messageRepository) {
    messageRepository = new MessageRepository();
  }
  return messageRepository;
};

export const getUsageEventRepository = (): IUsageEventRepository => {
  if (!usageEventRepository) {
    usageEventRepository = new UsageEventRepository();
  }
  return usageEventRepository;
};

export const getProviderCallEventRepository = (): IProviderCallEventRepository => {
  if (!providerCallEventRepository) {
    providerCallEventRepository = new ProviderCallEventRepository();
  }
  return providerCallEventRepository;
};

export const getIdempotencyKeyRepository = (): IIdempotencyKeyRepository => {
  if (!idempotencyKeyRepository) {
    idempotencyKeyRepository = new IdempotencyKeyRepository();
  }
  return idempotencyKeyRepository;
};

