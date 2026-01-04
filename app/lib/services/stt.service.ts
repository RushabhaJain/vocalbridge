import { logger } from "../logger";

export interface TranscriptionResult {
  text: string;
  duration: number;
  provider: string;
  confidence: number;
}

/**
 * Mocked Speech-to-Text service.
 * Simulates transcribing audio data into text.
 */
export class SttService {
  /**
   * Transcribes an audio blob into text.
   * In this mock implementation, we simulate a delay and return a pre-defined or 
   * generated transcript based on the "audio" (which is actually ignored).
   * 
   * @param audioBuffer - The raw audio buffer
   * @returns A promise resolving to the transcription result
   */
  async transcribe(audioBuffer: Buffer): Promise<TranscriptionResult> {
    const startTime = Date.now();
    
    // Simulate network/processing latency (300ms - 1500ms)
    const latency = Math.floor(Math.random() * 1200) + 300;
    await new Promise((resolve) => setTimeout(resolve, latency));

    logger.info("STT Service: Transcription complete", { latencyMs: latency });

    return {
      text: "This is a mocked transcription of your voice input.",
      duration: Math.floor(audioBuffer.length / 16000), // Very rough estimate: 16kB/s
      provider: "mock-stt-v1",
      confidence: 0.98,
    };
  }
}

export const sttService = new SttService();
