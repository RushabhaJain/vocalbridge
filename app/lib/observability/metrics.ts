import { logger } from '../logger';
import { getRequestContext } from './context';

export interface Metric {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp: string;
}

/**
 * Utility for collecting and recording application metrics.
 * Integrates with the centralized logger and automatically includes request context.
 */
class MetricsCollector {
  /**
   * Records a timing metric (duration in ms)
   */
  recordDuration(name: string, durationMs: number, tags?: Record<string, string>) {
    const context = getRequestContext();
    const allTags = {
      ...tags,
      tenantId: context?.tenantId,
      correlationId: context?.correlationId,
    };

    logger.info(`Metric: ${name} = ${durationMs}ms`, allTags);
  }

  /**
   * Records a counter metric
   */
  increment(name: string, value: number = 1, tags?: Record<string, string>) {
    const context = getRequestContext();
    const allTags = {
      ...tags,
      tenantId: context?.tenantId,
      correlationId: context?.correlationId,
    };

    logger.info(`Metric Count: ${name} +${value}`, allTags);
  }
}

export const metrics = new MetricsCollector();
