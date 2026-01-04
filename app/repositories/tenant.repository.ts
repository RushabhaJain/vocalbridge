import { prisma } from "@/app/lib/prisma";
import { ITenantRepository } from "./interfaces";

/**
 * Repository for managing Tenant data persistence.
 * Handles lookups by ID and API key, and tenant creation.
 */
export class TenantRepository implements ITenantRepository {
  async findById(id: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      select: { id: true, name: true, apiKey: true },
    });
    return tenant;
  }

  async findByApiKey(apiKey: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { apiKey },
      select: { id: true, name: true, apiKey: true },
    });
    return tenant;
  }

  async create(data: { name: string; apiKey: string }) {
    const tenant = await prisma.tenant.create({
      data,
      select: {
        id: true,
        name: true,
        apiKey: true,
        createdAt: true,
      },
    });
    return tenant;
  }

  async findAll() {
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true,
        _count: {
          select: {
            agents: true,
            sessions: true,
          },
        },
      },
    });
    return tenants;
  }
}

