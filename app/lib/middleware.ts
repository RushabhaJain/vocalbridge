import { NextRequest } from "next/server";
import { getTenantRepository } from "@/app/repositories";
import { logger } from "./logger";
import { getRequestContext } from "./observability/context";

export interface AuthenticatedRequest extends NextRequest {
  tenantId: string;
}

/**
 * Middleware to authenticate requests using API key
 * Returns tenantId if valid, throws error if invalid
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<string> {
  const apiKey = request.headers.get("x-api-key") || request.headers.get("authorization")?.replace("Bearer ", "");

  if (!apiKey) {
    throw new Error("API key is required");
  }

  const tenantRepository = getTenantRepository();
  const tenant = await tenantRepository.findByApiKey(apiKey);

  if (!tenant) {
    logger.warn("Invalid API key attempted", { apiKey: apiKey.substring(0, 8) + "..." });
    throw new Error("Invalid API key");
  }

  // Update request context with tenantId if available
  const context = getRequestContext();
  if (context) {
    context.tenantId = tenant.id;
  }

  return tenant.id;
}

