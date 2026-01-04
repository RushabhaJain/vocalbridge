import { NextResponse } from "next/server";
import { logger } from "../logger";
import { ApiError } from "./api-error";

/**
 * Handle errors and return appropriate HTTP responses
 */
export function handleError(error: unknown): NextResponse {
  // Handle custom API errors
  if (error instanceof ApiError) {
    logger.error(`API Error: ${error.message}`, error, {
      statusCode: error.statusCode,
      code: error.code,
    });

    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }

  // Handle standard Error instances
  if (error instanceof Error) {
    // Check for authentication errors
    if (error.message.includes("API key")) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    // Check for not found errors
    if (error.message.includes("not found")) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    logger.error("Unexpected error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }

  // Handle unknown errors
  logger.error("Unknown error", error);
  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 }
  );
}

