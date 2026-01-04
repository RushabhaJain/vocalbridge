export type Provider = "vendorA" | "vendorB";

export interface Agent {
  id: string;
  tenantId: string;
  name: string;
  primaryProvider: string;
  fallbackProvider: string | null;
  systemPrompt: string;
  enabledTools: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentConfig {
  primaryProvider: Provider;
  fallbackProvider?: Provider;
  systemPrompt: string;
  enabledTools?: string[];
}

export interface VendorResponse {
  outputText?: string;
  tokensIn?: number;
  tokensOut?: number;
  latencyMs?: number;
  choices?: Array<{ message: { content: string } }>;
  usage?: { input_tokens: number; output_tokens: number };
  retryAfterMs?: number;
}

export interface ProviderCallResult {
  success: boolean;
  response?: VendorResponse;
  error?: {
    code: string;
    message: string;
    statusCode?: number;
    retryAfterMs?: number;
  };
  latencyMs: number;
}

export interface UsageEventData {
  tenantId: string;
  agentId: string;
  sessionId: string;
  provider: Provider;
  tokensIn: number;
  tokensOut: number;
  cost: number;
}

export interface MessageMetadata {
  provider?: string;
  tokensIn?: number;
  tokensOut?: number;
  cost?: number;
  latencyMs?: number;
  usedFallback?: boolean;
  voice?: boolean;
  metrics?: {
    sttLatencyMs: number;
    agentLatencyMs: number;
    ttsLatencyMs: number;
    totalLatencyMs: number;
    audioDuration: number;
  };
  [key: string]: unknown;
}

export interface ConversationMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  metadata?: MessageMetadata;
}

export interface Session {
  id: string;
  tenantId?: string;
  agentId: string;
  customerId: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  messages?: ConversationMessage[];
}

export interface SendMessageResponse {
  assistantMessage: string;
  provider: Provider;
  tokensIn: number;
  tokensOut: number;
  cost: number;
  metadata: MessageMetadata;
}
