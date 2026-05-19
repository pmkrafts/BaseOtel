# OtelRedisNative

Native OTel API Observability Platform built with Node.js, TypeScript, Express, Redis, and OpenTelemetry.

## Project Goal

Build a production-grade backend platform that demonstrates:

- Middleware architecture
- Redis-backed rate limiting
- Native observability (metrics and traces)
- Structured logging
- Resilience and performance engineering

## What This Project Currently Implements

- Express server with modular route registration
- Request correlation via x-request-id middleware
- Structured request logging to app, metrics, and trace streams
- Redis client with retry strategy, reconnect behavior, and graceful shutdown helpers
- Redis-backed naive rate limiter (INCR + EXPIRE)
- Redis test and flow endpoints for SET/GET validation
- Dockerfile and Docker Compose for containerized local development

## Tech Stack

- Node.js
- TypeScript
- Express
- Redis (ioredis)
- OpenTelemetry (planned in next phases)
- Pino logging
- Vitest, ESLint, Prettier

## Architecture Understanding

### Request Lifecycle

1. Request enters Express app.
2. Request ID middleware creates/propagates x-request-id.
3. Request logger starts timing.
4. Rate limiter checks Redis counter for client key.
5. Route handler executes business logic.
6. Response is sent; request logger emits structured event.

### Redis Rate Limiter Design (Naive Fixed Window)

Per request:

1. Build key: rate_limit:{clientIp}
2. INCR key
3. If count is 1, EXPIRE key by RATE_LIMIT_WINDOW seconds
4. If count > RATE_LIMIT_MAX, return HTTP 429
5. Otherwise continue request

This design is simple and fast, but can allow boundary bursts. Sliding-window and Lua-based atomic paths are planned next.

## Current Status

Implemented and validated:

- TypeScript build passes
- Redis integration works for SET/GET
- Limiter blocks excess traffic with HTTP 429
- Logs are split by concern (app/error/metrics/trace)
- Docker build and compose config are working

## Prerequisites

- Node.js 20+
- npm 10+
- Redis 7+ (local Docker is fine)

## Environment

Create .env with:

    PORT=4000
    REDIS_HOST=localhost
    REDIS_PORT=6379
    RATE_LIMIT_WINDOW=10
    RATE_LIMIT_MAX=5

## Quick Start (Local Node + Compose Redis)

Install dependencies:

    npm install

Start development mode (auto-starts Redis via predev):

    npm run dev

On Ctrl+C, postdev stops Redis automatically.

## Quick Start (Full Docker Stack)

Run API + Redis together:

    npm run docker:stack:up

Stop stack:

    npm run docker:stack:down

## Build and Run (Node Runtime)

Build TypeScript:

    npm run build

Run compiled server:

    npm run start

## Scripts

- dev: Start Redis (compose) + run server in watch mode
- build: Compile TypeScript with tsc
- start: Run compiled server from dist
- docker:up: Start redis service with Docker Compose
- docker:down: Stop redis service with Docker Compose
- docker:stack:up: Build and run full stack (app + redis)
- docker:stack:down: Stop and remove full stack
- test: Placeholder script

## API Endpoints

- GET /health: service liveness and uptime
- GET /api/data: sample API endpoint (rate limiter target)
- GET /redis-test: performs Redis SET + GET verification
- GET /redis-flow: explicit helper-function flow for SET + GET

## Validate Behavior

### 1) Health

    curl http://localhost:4000/health

### 2) Redis SET/GET

    curl http://localhost:4000/redis-test
    curl http://localhost:4000/redis-flow

### 3) Rate limiter test (PowerShell 5.1)

    1..10 | ForEach-Object {
      try {
        $r = Invoke-WebRequest -Uri "http://localhost:4000/api/data" -Method GET
        "{0}: {1}" -f $_, $r.StatusCode
      } catch {
        "{0}: {1}" -f $_, $_.Exception.Response.StatusCode.value__
      }
    }

Expected: initial 200 responses followed by 429 when limit is exceeded.

## Project Structure

    src/
      app/
      config/
      middleware/
        rateLimiter/
      telemetry/
      redis/
      metrics/
      logging/
      storage/
      observability/
      routes/
      services/
      utils/
      tests/
      scripts/
      dashboards/
    storage/
      logs/
      metrics/
      traces/

## Roadmap

Implementation direction:

1. Foundation and Express APIs
2. Typed env config and structured logs
3. Request correlation and Redis integration
4. Rate limiting (naive and sliding window)
5. OpenTelemetry instrumentation
6. Native metrics and trace pipelines
7. System monitoring and CLI dashboard
8. Load testing and resilience hardening

## Notes

- Current limiter uses fail-open behavior on Redis errors to preserve API availability.
- For production fairness, migrate to sliding-window + Lua atomic scripts in next phase.

## License

ISC
