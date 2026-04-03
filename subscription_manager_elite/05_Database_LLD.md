# Database (LLD)

## users
id (PK), email (unique), password_hash, created_at

## subscriptions
id (PK), user_id (FK), name, amount, currency,
billing_cycle (enum), interval_count,
next_billing_date, last_billing_date,
category, status, created_at, updated_at

## payments
id (PK), subscription_id (FK), amount, currency,
status, payment_date, source

## reminders
id (PK), subscription_id (FK),
reminder_type, days_offset,
scheduled_at, sent_at, status

## detection_logs
id (PK), user_id (FK), raw_text,
parsed_data (jsonb), confidence_score, status, created_at

## Indexes
- subscriptions(user_id)
- subscriptions(next_billing_date)
- reminders(scheduled_at)
- payments(subscription_id)
