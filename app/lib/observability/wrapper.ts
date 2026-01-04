import { NextRequest, NextResponse } from 'next/server';
import { createRequestContext, runWithContext } from './context';
import { metrics } from './metrics';
import { logger } from '../logger';

type Handler = (request: NextRequest, ...args: unknown[]) => Promise<NextResponse>;

/**
 * Higher-order function that wraps Next.js API route handlers with observability features.
 * 
 * It ensures that:
 * 1. A unique request context (Correlation ID) is created or propagated.
 * 2. Incoming requests are logged with method and path.
 * 3. Latency is tracked and recorded as a duration metric.
 * 4. Unhandled errors are caught, logged, and returned as 500 responses with the correlation ID.
 * 5. All downstream calls within the same request share the same AsyncLocalStorage context.
 * 
 * @param handler - The original API route handler
 * @returns A wrapped handler with observability injected
 */
export function withObservability(handler: Handler): Handler {
  return async (request: NextRequest, ...args: unknown[]) => {
    const context = createRequestContext();
    
    // Extract correlation ID from headers if present (for cross-service tracing)
    const incomingCorrelationId = request.headers.get('x-correlation-id');
    if (incomingCorrelationId) {
      context.correlationId = incomingCorrelationId;
    }

    return runWithContext(context, async () => {
      const { method, url } = request;
      const path = new URL(url).pathname;
      
      logger.info(`Incoming request: ${method} ${path}`);
      
      try {
        const response = await handler(request, ...args);
        
        const duration = Date.now() - context.startTime;
        metrics.recordDuration('http_request_duration', duration, {
          method,
          path,
          status: response.status.toString(),
        });

        // Add correlation ID to response headers
        response.headers.set('x-correlation-id', context.correlationId);
        
        return response;
      } catch (error) {
        const duration = Date.now() - context.startTime;
        metrics.recordDuration('http_request_duration', duration, {
          method,
          path,
          status: '500',
        });
        
        logger.error(`Unhandled error in ${method} ${path}`, error);
        
        const response = NextResponse.json(
          { error: 'Internal Server Error', correlationId: context.correlationId },
          { status: 500 }
        );
        response.headers.set('x-correlation-id', context.correlationId);
        return response;
      }
    });
  };
}
