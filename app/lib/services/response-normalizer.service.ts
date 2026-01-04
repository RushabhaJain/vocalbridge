import { VendorResponse } from "../types";

export interface NormalizedResponse {
  text: string;
  tokensIn: number;
  tokensOut: number;
}

export class ResponseNormalizerService {
  /**
   * Normalize vendor response to common format
   */
  normalize(response: VendorResponse): NormalizedResponse {
    // VendorA format
    if (response.outputText !== undefined) {
      return {
        text: response.outputText,
        tokensIn: response.tokensIn ?? 0,
        tokensOut: response.tokensOut ?? 0,
      };
    }

    // VendorB format
    if (response.choices && response.choices.length > 0) {
      return {
        text: response.choices[0].message.content,
        tokensIn: response.usage?.input_tokens ?? 0,
        tokensOut: response.usage?.output_tokens ?? 0,
      };
    }

    throw new Error("Invalid response format from provider");
  }
}

