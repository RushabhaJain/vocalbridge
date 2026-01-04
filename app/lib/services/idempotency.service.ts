import { IIdempotencyKeyRepository } from "@/app/repositories/interfaces";
import { logger } from "../logger";

/**
 * Service for managing request idempotency.
 * Prevents multiple processing of the same request by caching and retrieving previous responses.
 */
export class IdempotencyService {
  constructor(private idempotencyKeyRepository: IIdempotencyKeyRepository) {}

  /**
   * Checks for a cached response associated with the given idempotency key.
   * 
   * @template T - The type of the cached response
   * @param idempotencyKey - Unique key for the request (optional)
   * @param tenantId - The tenant ID for scoping
   * @returns The cached response of type T, or null if not found or no key provided
   */
  async check<T>(
    idempotencyKey: string | undefined,
    tenantId: string
  ): Promise<T | null> {
    if (!idempotencyKey) {
      return null;
    }

    const existing = await this.idempotencyKeyRepository.findByKey(idempotencyKey);

    if (existing && existing.tenantId === tenantId) {
      logger.info("Idempotent request detected, returning cached response", {
        idempotencyKey,
        tenantId,
      });
      return JSON.parse(existing.response);
    }

    return null;
  }

  /**
   * Stores a response in the idempotency cache.
   * 
   * @param idempotencyKey - Unique key for the request
   * @param tenantId - The tenant ID for scoping
   * @param response - The response data to cache
   * @param expiryHours - Duration in hours before the cache expires (default 24)
   */
  async store(
    idempotencyKey: string | undefined,
    tenantId: string,
    response: unknown,
    expiryHours: number = 24
  ): Promise<void> {
    if (!idempotencyKey) {
      return;
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiryHours);

    await this.idempotencyKeyRepository.upsert({
      key: idempotencyKey,
      tenantId,
      response: JSON.stringify(response)
    });
  }
}

