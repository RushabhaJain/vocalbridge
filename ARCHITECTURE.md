# Architecture Documentation

This document outlines the high-level and low-level design of the VocalBridge platform.

## High-Level Design (HLD)

### Components

The system is built as a modular Next.js application:

- **Frontend**: A React-based dashboard for managing agents, testing chat sessions, and viewing usage metrics.
- **API Backend**: Next.js API Routes (`/api/*`) handling core business logic, authentication, and provider orchestration.
- **Database**: Prisma ORM with SQLite (for development).
- **Domain Services**: Specialized services handles specific logic:
    - `AgentService`: Management of agent configurations.
    - `ConversationService`: Orchestrates the message flow.
    - `VoiceService`: Orchestrates the voice channel flow (STT -> LLM -> TTS).
    - `UsageService`: Aggregates token usage and costs.
- **Provider Adapters**: Pluggable modules for interacting with different AI vendors.

### Tenancy Isolation

VocalBridge is designed for strict multi-tenancy:

1. **Authentication**: Every request (except tenant creation) requires a `X-API-Key`.
2. **Data Isolation**: All database models (`Agent`, `Session`, `Message`, `UsageEvent`, etc.) include a `tenantId`.
3. **Internal Scoping**: Repositories automatically filter by `tenantId` to ensure data cannot leak between tenants.
4. **Context Propagation**: `AsyncLocalStorage` is used to propagate the `tenantId` and `correlationId` through the service layer without manual passing.

### Scaling Plan

- **Compute**: API routes are stateless and can be deployed to serverless environments (e.g., Vercel, AWS Lambda) for horizontal scaling.
- **Database**: While SQLite is used for development, the Prisma schema is compatible with PostgreSQL for production environments (RDS/Cloud SQL).
- **Caching**: 
    - **Idempotency**: Currently stored in the DB, but can be moved to Redis for lower latency.
    - **Sessions**: Frequently accessed session data can be cached in Redis.
- **Queueing**: For extremely high volume, usage event persistence can be moved to an asynchronous queue (e.g., SQS/RabbitMQ).

### Failure Handling

1. **Transient Failures**: Handled via exponential backoff retries (for 500s and 429s).
2. **Hard Failures**: If the primary provider fails after all retries, the system automatically attempts the `fallbackProvider`.
3. **Observability**: Every request is wrapped with `withObservability`, ensuring errors are logged with a `correlationId` and returned as structured JSON.
4. **Timeouts**: Individual provider calls are guarded by configurable timeouts to prevent hanging requests.

---

## Low-Level Design (LLD)

### Data Schema (Prisma)

- **Tenant**: Central entity representing a customer organization.
- **Agent**: AI configuration (prompts, providers, tools) belonging to a tenant.
- **Session**: A conversation container between a customer and an agent.
- **Message**: Individual message items within a session.
- **UsageEvent**: Records token usage (`tokensIn`, `tokensOut`) and calculated `cost`.
- **ProviderCallEvent**: Logs every single call attempt to a vendor, including success/failure and latency.
- **IdempotencyKey**: Stores hashes of requests to prevent duplicate processing.

### Adapter Interface

We use the **Adapter Pattern** for provider abstractions:

- `IProviderAdapter`: Interface defining the `chat` and `getName` methods.
- `BaseProviderAdapter`: Abstract class implementing common logic:
    - Retry loop with exponential backoff.
    - Timeout handling using `Promise.race`.
    - Result normalization.
- `VendorAAdapter` / `VendorBAdapter`: Specific implementations that simulate unique vendor schemas and failure modes.

### Retry & Fallback Logic

The reliability logic is split into two layers:

1. **Intra-Provider Retry**: Implemented in `BaseProviderAdapter.chat()`. It retries transient errors (500, 429) using a backoff delay.
2. **Inter-Provider Fallback**: Implemented in `ProviderCallService.callWithFallback()`. If the primary provider adapter returns a final failure, it instantiates and calls the fallback adapter.

### Idempotency Approach

- **Mechanism**: The `IdempotencyService` checks for an existing `IdempotencyKey` record before processing a message.
- **Storage**: Responses are stringified and stored in the database, indexed by the unique key and `tenantId`.
- **Expiration**: Keys are currently stored with a default 24-hour expiration (managed at the application level during cleanup or via future DB TTL).
- **Safety**: Ensures that if a client retries a successful request (e.g., due to a client-side timeout), they receive the cached response instead of triggering a new provider call and charge.

### Voice Channel Architecture

The voice channel follows a structured pipeline pattern coordinated by the `VoiceService`:

1.  **Ingress**: Audio is received as a multipart file upload (`FormData`) via the `/api/voice/chat` endpoint.
2.  **Transcription (STT)**: The raw audio buffer is passed to a pluggable `SttService`. Future integrations can implement this using:
    - **Deepgram**: For high-performance, low-latency streaming transcription.
    - **AWS Transcribe** or **GCP Speech-to-Text**: For robust multi-language support.
3.  **Agent Processing**: The resulting text is passed to the standard `ConversationService`, maintaining consistency in context and usage tracking.
4.  **Synthesis (TTS)**: The agent's assistant message is converted back to speech via the `TtsService`. Potential future providers include:
    - **Deepgram Aura**: For human-like, low-latency speech synthesis.
    - **AWS Polly** or **GCP Text-to-Speech**: For a wide variety of voices and SSML support.
5.  **Egress**: The system returns a JSON response containing the transcription text, assistant text, and a URL for the synthesized audio playback.
