# Agent Gateway

A production-grade multi-tenant AI agent management platform with unified conversation API, provider abstraction, usage metering, and React dashboard.

## Features

- **Multi-Tenant Architecture**: Complete tenant isolation with API key authentication
- **Unified Conversation API**: Vendor-agnostic API for managing conversations
- **Provider Abstraction**: Extensible adapter pattern supporting multiple AI providers (VendorA, VendorB)
- **Reliability**: Exponential backoff retries, timeouts, and automatic fallback between providers
- **Usage Metering**: Real-time cost calculation and usage tracking
- **React Dashboard**: Full-featured UI for agent management, chat testing, and analytics

## Getting Started

### 1. Installation

```bash
npm install
```

### 2. Database Setup

Using SQLite for local development:

```bash
npm run db:push
```

### 3. Running the Application

This runs both the Next.js frontend and the API backend:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Seeding Data

To bootstrap the database with 2 tenants and 3 agents (Customer Support, Sales, and Technical Support):

```bash
npm run db:seed
```

**Note**: The seed command will output the API keys for the created tenants. Keep these for your API requests.

## Sample API Commands

Replace `TENANT_API_KEY`, `AGENT_ID`, and `SESSION_ID` with actual values from the seed output or dashboard.

### 1. List All Agents
```bash
curl -H "X-API-Key: TENANT_API_KEY" http://localhost:3000/api/agents
```

### 2. Create a Conversation Session
```bash
curl -X POST \
     -H "X-API-Key: TENANT_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"customerId": "customer-123"}' \
     http://localhost:3000/api/agents/AGENT_ID/sessions
```

### 3. Send a Message
```bash
curl -X POST \
     -H "X-API-Key: TENANT_API_KEY" \
     -H "X-Idempotency-Key: unique-request-id" \
     -H "Content-Type: application/json" \
     -d '{"message": "Hello, I need help with my account."}' \
     http://localhost:3000/api/sessions/SESSION_ID/messages
```

### 4. Get Usage Analytics
```bash
curl -H "X-API-Key: TENANT_API_KEY" http://localhost:3000/api/usage?period=day
```

## License

MIT
