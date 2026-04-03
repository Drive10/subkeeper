# Event Design

## Topics
- subscription.created
- payment.detected
- reminder.triggered
- notification.sent

## Example
{
  "event": "subscription.created",
  "user_id": "u_1",
  "subscription_id": "s_1",
  "timestamp": "2026-04-03T10:00:00Z"
}

## Idempotency
- event_id (UUID)
- de-duplication at consumer
