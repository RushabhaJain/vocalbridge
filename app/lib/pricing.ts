import { Provider } from "./types";

/**
 * Pricing table for AI providers (per 1K tokens)
 */
export const PRICING_TABLE: Record<Provider, { input: number; output: number }> = {
  vendorA: {
    input: 0.002, // $0.002 per 1K input tokens
    output: 0.002, // $0.002 per 1K output tokens
  },
  vendorB: {
    input: 0.003, // $0.003 per 1K input tokens
    output: 0.003, // $0.003 per 1K output tokens
  },
};

/**
 * Calculate cost for token usage
 */
export function calculateCost(
  provider: Provider,
  tokensIn: number,
  tokensOut: number
): number {
  const pricing = PRICING_TABLE[provider];
  const inputCost = (tokensIn / 1000) * pricing.input;
  const outputCost = (tokensOut / 1000) * pricing.output;
  return Number((inputCost + outputCost).toFixed(6));
}

