import { AsyncLocalStorage } from 'node:async_hooks';
import { v4 as uuidv4 } from 'uuid';

export interface RequestContext {
  correlationId: string;
  tenantId?: string;
  agentId?: string;
  sessionId?: string;
  startTime: number;
}

const contextStorage = new AsyncLocalStorage<RequestContext>();

export const getRequestContext = () => contextStorage.getStore();

export const runWithContext = <T>(context: RequestContext, fn: () => T): T => {
  return contextStorage.run(context, fn);
};

export const createRequestContext = (tenantId?: string): RequestContext => ({
  correlationId: uuidv4(),
  tenantId,
  startTime: Date.now(),
});
