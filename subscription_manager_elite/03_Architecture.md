# Architecture (Elite)

## Style
- Modular Monolith (v1) → Microservices (v2+)
- Event-driven for async flows

## Components
- API Gateway
- Auth Module
- Subscription Module
- Billing Engine
- Reminder Engine
- Detection Engine
- Analytics Engine
- Notification Worker

## Data Flow (high-level)
User Action → API → DB → Event → Queue → Worker → Notification

## Storage
- PostgreSQL (OLTP)
- Redis (cache + rate limit + queue)
- Object store (optional) for raw emails

## Observability
- Logs (structured)
- Metrics (Prometheus)
- Tracing (OpenTelemetry)

## Resilience
- Idempotency keys for write APIs
- Retries with backoff for workers
- Dead-letter queue for failed jobs
