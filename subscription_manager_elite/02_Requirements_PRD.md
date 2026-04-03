# Product Requirements (PRD)

## Personas
- Working professionals
- Developers / SaaS users
- Freelancers

## Use Cases
- Track subscriptions (manual + auto)
- Get renewal alerts
- View monthly spend
- Identify unused subscriptions

## Functional Requirements
- CRUD subscriptions
- Billing cycles (monthly/yearly/custom)
- Reminder scheduling (T-3, T-1, T0)
- Detection via SMS/email (regex → ML later)
- Analytics (monthly totals, category split)

## Non-Functional Requirements
- Availability: 99.9%
- Latency: P95 < 200ms (reads), < 500ms (writes)
- Security: JWT, rate limiting, encryption at rest (sensitive fields)
- Scalability: 10k → 1M users
