import { IAgentRepository } from "@/app/repositories/interfaces";
import { Agent } from "../types";

/**
 * Service for managing AI agents.
 * Handles creation, retrieval, and updates of agents scoped by tenant.
 */
export interface IAgentService {
  /**
   * Creates a new agent for a tenant.
   * 
   * @param tenantId - The ID of the tenant owning the agent
   * @param data - The agent configuration data
   * @returns A promise that resolves to the created Agent
   */
  createAgent(tenantId: string, data: {
    name: string;
    primaryProvider: string;
    fallbackProvider: string | null;
    systemPrompt: string;
    enabledTools: string[];
  }): Promise<Agent>;
  
  /**
   * Retrieves all agents for a specific tenant.
   * 
   * @param tenantId - The ID of the tenant
   * @returns A promise that resolves to an array of Agents
   */
  getAgents(tenantId: string): Promise<Agent[]>;

  /**
   * Retrieves a specific agent by ID and tenant ID.
   * 
   * @param id - The agent ID
   * @param tenantId - The tenant ID for scoping
   * @returns A promise that resolves to the Agent
   * @throws {NotFoundError} If the agent is not found
   */
  getAgentById(id: string, tenantId: string): Promise<Agent>;

  /**
   * Updates an existing agent.
   * 
   * @param id - The agent ID to update
   * @param tenantId - The tenant ID for scoping
   * @param data - The partial agent data to update
   * @returns A promise that resolves to the updated Agent
   */
  updateAgent(id: string, tenantId: string, data: {
    name?: string;
    primaryProvider?: string;
    fallbackProvider?: string | null;
    systemPrompt?: string;
    enabledTools?: string[];
  }): Promise<Agent>;
}

export class AgentService implements IAgentService {
  constructor(private agentRepository: IAgentRepository) {}

  async createAgent(tenantId: string, data: {
    name: string;
    primaryProvider: string;
    fallbackProvider: string | null;
    systemPrompt: string;
    enabledTools: string[];
  }) {
    return this.agentRepository.create({
      tenantId,
      ...data,
    });
  }

  async getAgents(tenantId: string) {
    return this.agentRepository.findByTenant(tenantId);
  }

  async getAgentById(id: string, tenantId: string) {
    const agent = await this.agentRepository.findById(id, tenantId);
    if (!agent) {
      const { NotFoundError } = await import("../errors/api-error");
      throw new NotFoundError("Agent not found");
    }
    return agent;
  }

  async updateAgent(id: string, tenantId: string, data: {
    name?: string;
    primaryProvider?: string;
    fallbackProvider?: string | null;
    systemPrompt?: string;
    enabledTools?: string[];
  }) {
    return this.agentRepository.update(id, tenantId, data);
  }
}
