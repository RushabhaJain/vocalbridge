import { prisma } from "@/app/lib/prisma";
import { IIdempotencyKeyRepository } from "./interfaces";

export class IdempotencyKeyRepository implements IIdempotencyKeyRepository {
  async findByKey(key: string) {
    const idempotencyKey = await prisma.idempotencyKey.findUnique({
      where: { key },
      select: {
        id: true,
        key: true,
        tenantId: true,
        response: true
      },
    });
    return idempotencyKey;
  }

  async upsert(data: {
    key: string;
    tenantId: string;
    response: string;
  }) {
    const idempotencyKey = await prisma.idempotencyKey.upsert({
      where: { key: data.key },
      create: data,
      update: {
        response: data.response,
      },
      select: {
        id: true,
        key: true,
        tenantId: true,
        response: true,
      },
    });
    return idempotencyKey;
  }
}

