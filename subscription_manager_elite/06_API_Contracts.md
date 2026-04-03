# API Contracts

## POST /subscriptions
Request:
{
  "name": "Netflix",
  "amount": 499,
  "currency": "INR",
  "billing_cycle": "monthly",
  "interval_count": 1,
  "next_billing_date": "2026-05-01"
}

Response:
{
  "id": "sub_123",
  "status": "created"
}

## GET /subscriptions
Response:
[
  {
    "id": "sub_123",
    "name": "Netflix",
    "amount": 499,
    "next_billing_date": "2026-05-01"
  }
]

## POST /detect/sms
{
  "text": "Your Netflix subscription of ₹499 has been charged"
}
