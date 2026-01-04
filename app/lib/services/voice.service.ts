import { ConversationService } from "../conversation-service";
import { sttService, SttService } from "./stt.service";
import { ttsService, TtsService } from "./tts.service";
import { logger } from "../logger";

export interface VoiceChatResponse {
  transcript: string;
  assistantMessage: string;
  audioUrl: string;
  provider: string;
  metrics: {
    sttLatencyMs: number;
    agentLatencyMs: number;
    ttsLatencyMs: number;
    totalLatencyMs: number;
    audioDuration: number;
  };
  tokensIn: number;
  tokensOut: number;
  cost: number;
}

/**
 * Orchestrator for the voice channel.
 * Coordinates transcription, agent processing, and speech synthesis.
 */
export class VoiceService {
  constructor(
    private conversationService = new ConversationService(),
    private stt = sttService,
    private tts = ttsService
  ) {}

  /**
   * Processes a voice message.
   * 
   * @param params - Parameters for the voice chat
   * @returns A promise resolving to the voice chat response
   */
  async voiceChat(params: {
    tenantId: string;
    agentId: string;
    sessionId: string;
    audioBuffer: Buffer;
    idempotencyKey?: string;
  }): Promise<VoiceChatResponse> {
    const startTime = Date.now();
    const { tenantId, agentId, sessionId, audioBuffer, idempotencyKey } = params;

    logger.info("VoiceService: Starting voice chat processing", {
      tenantId,
      agentId,
      sessionId,
      audioSize: audioBuffer.length,
    });

    // 1. Speech-to-Text
    const sttStartTime = Date.now();
    const transcription = await this.stt.transcribe(audioBuffer);
    const sttLatencyMs = Date.now() - sttStartTime;

    // 2. Chat Agent Processing
    const agentStartTime = Date.now();
    const chatResponse = await this.conversationService.sendMessage(
      tenantId,
      agentId,
      sessionId,
      transcription.text,
      idempotencyKey
    );
    const agentLatencyMs = Date.now() - agentStartTime;

    // 3. Text-to-Speech
    const ttsStartTime = Date.now();
    const synthesis = await this.tts.synthesize(chatResponse.assistantMessage);
    const ttsLatencyMs = Date.now() - ttsStartTime;

    const totalLatencyMs = Date.now() - startTime;

    logger.info("VoiceService: Voice chat processing complete", {
      totalLatencyMs,
      sttLatencyMs,
      agentLatencyMs,
      ttsLatencyMs,
    });

    return {
      transcript: transcription.text,
      assistantMessage: chatResponse.assistantMessage,
      audioUrl: synthesis.audioUrl,
      provider: chatResponse.provider,
      tokensIn: chatResponse.tokensIn,
      tokensOut: chatResponse.tokensOut,
      cost: chatResponse.cost,
      metrics: {
        sttLatencyMs,
        agentLatencyMs,
        ttsLatencyMs,
        totalLatencyMs,
        audioDuration: transcription.duration,
      },
    };
  }
}

export const voiceService = new VoiceService();
