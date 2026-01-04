import { NextRequest } from "next/server";
import { POST } from "@/app/api/voice/chat/route";
import { authenticateRequest } from "@/app/lib/middleware";
import { sttService } from "@/app/lib/services/stt.service";
import { ttsService } from "@/app/lib/services/tts.service";
import { ConversationService } from "@/app/lib/conversation-service";
import { getSessionRepository } from "@/app/repositories";

jest.mock("@/app/lib/middleware", () => ({
  authenticateRequest: jest.fn(),
}));

jest.mock("@/app/repositories", () => ({
  getSessionRepository: jest.fn(),
}));

// Mock ConversationService to avoid DB hits during route test
jest.mock("@/app/lib/conversation-service");

describe("Voice API Route", () => {
  const tenantId = "t1";
  const agentId = "a1";
  const sessionId = "s1";

  beforeEach(() => {
    jest.clearAllMocks();
    (authenticateRequest as jest.Mock).mockResolvedValue(tenantId);
    
    (getSessionRepository as jest.Mock).mockReturnValue({
      findById: jest.fn().mockResolvedValue({ id: sessionId, tenantId, agentId }),
    });

    (ConversationService.prototype.sendMessage as jest.Mock).mockResolvedValue({
      assistantMessage: "Hello from the agent!",
      provider: "vendorA",
      tokensIn: 10,
      tokensOut: 20,
      cost: 0.001,
      metadata: { latencyMs: 100 },
    });
  });

  it("should process voice chat successfully", async () => {
    const formData = new FormData();
    const audioBlob = new Blob(["fake-audio-content"], { type: "audio/wav" });
    formData.append("audio", audioBlob);
    formData.append("agentId", agentId);
    formData.append("sessionId", sessionId);

    // Create a request with multipart/form-data
    // Note: NextRequest doesn't perfectly handle FormData in Node/Jest without polyfills, 
    // but Next.js internal tests handle it. Let's try.
    const request = new NextRequest("http://localhost/api/voice/chat", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      transcript: "This is a mocked transcription of your voice input.",
      assistantMessage: "Hello from the agent!",
      audioUrl: expect.stringContaining("http"),
      provider: "vendorA",
    });
    
    expect(data.metrics).toBeDefined();
    expect(data.metrics.sttLatencyMs).toBeGreaterThan(0);
  });

  it("should return 400 if required fields are missing", async () => {
    const formData = new FormData();
    formData.append("agentId", agentId);

    const request = new NextRequest("http://localhost/api/voice/chat", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
