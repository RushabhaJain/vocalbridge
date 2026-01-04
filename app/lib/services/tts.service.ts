import { logger } from "../logger";

export interface SynthesisResult {
  audioUrl: string;
  provider: string;
  latencyMs: number;
  wordCount: number;
}

/**
 * Mocked Text-to-Speech service.
 * Simulates converting text into a speech audio URL.
 */
export class TtsService {
  /**
   * Synthesizes text into a speech audio URL.
   * In this mock implementation, we return a standard placeholder URL or 
   * a data URI that simulates an audio response.
   * 
   * @param text - The text to synthesize
   * @returns A promise resolving to the synthesis result
   */
  async synthesize(text: string): Promise<SynthesisResult> {
    const startTime = Date.now();
    
    // Simulate synthesis latency (200ms - 1000ms)
    const latency = Math.floor(Math.random() * 800) + 200;
    await new Promise((resolve) => setTimeout(resolve, latency));

    const wordCount = text.split(/\s+/).length;
    logger.info("TTS Service: Synthesis complete", { latencyMs: latency, wordCount });

    return {
      // Returning a placeholder base64 blank wav or similar would be better, 
      // but for now, we'll return a mock URL.
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", 
      provider: "mock-tts-v1",
      latencyMs: Date.now() - startTime,
      wordCount,
    };
  }
}

export const ttsService = new TtsService();
