import { NextRequest, NextResponse } from "next/server";
import { getTenantRepository } from "@/app/repositories";
import { logger } from "@/app/lib/logger";
import { handleError } from "@/app/lib/errors/error-handler";
import { BadRequestError } from "@/app/lib/errors/api-error";
import crypto from "crypto";

/**
 * POST /api/tenants - Create a new tenant (admin endpoint, no auth for simplicity)
 * In production, this would be protected
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      throw new BadRequestError("name is required");
    }

    // Generate API key
    const apiKey = `sk_${crypto.randomBytes(32).toString("hex")}`;

    const tenantRepository = getTenantRepository();
    const tenant = await tenantRepository.create({
      name,
      apiKey,
    });

    logger.info("Tenant created", { tenantId: tenant.id, name });

    return NextResponse.json({
      id: tenant.id,
      name: tenant.name,
      apiKey: tenant.apiKey,
      createdAt: tenant.createdAt,
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * GET /api/tenants - List all tenants (admin endpoint)
 */
export async function GET() {
  try {
    const tenantRepository = getTenantRepository();
    const tenants = await tenantRepository.findAll();

    return NextResponse.json(tenants);
  } catch (error) {
    return handleError(error);
  }
}

