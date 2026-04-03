# Subscription Manager Elite (SubSense)

A production-ready subscription intelligence platform for tracking, detecting, and optimizing recurring payments.

## Features

- **Subscription Management**: Full CRUD operations for subscriptions with multiple billing cycles
- **Smart Detection**: SMS/Email parsing to automatically detect subscriptions
- **Reminder Engine**: Automated reminders (T-3, T-1, T-0) for upcoming renewals
- **Analytics Dashboard**: Monthly spend tracking, category breakdown, unused subscription detection
- **Payment Tracking**: Record and track payment history
- **RESTful API**: Complete API with authentication and rate limiting

## Tech Stack

- **Runtime**: Node.js 20+ with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Cache/Queue**: Redis with BullMQ
- **Validation**: Zod
- **Authentication**: JWT (access + refresh tokens)
- **Testing**: Jest
- **Logging**: Winston

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev
```

### Development

```bash
# With Docker
docker-compose up

# Or local development
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Subscriptions
- `POST /api/subscriptions` - Create subscription
- `GET /api/subscriptions` - List subscriptions
- `GET /api/subscriptions/:id` - Get subscription
- `PATCH /api/subscriptions/:id` - Update subscription
- `DELETE /api/subscriptions/:id` - Delete subscription
- `POST /api/subscriptions/:id/pause` - Pause subscription
- `POST /api/subscriptions/:id/resume` - Resume subscription

### Reminders
- `POST /api/reminders` - Create reminder
- `GET /api/reminders` - List reminders

### Billing
- `POST /api/payments` - Record payment
- `GET /api/payments` - List payments

### Detection
- `POST /api/detect/sms` - Detect from SMS
- `POST /api/detect/email` - Detect from email
- `POST /api/detect/confirm` - Confirm detection

### Analytics
- `GET /api/analytics/monthly-spend` - Monthly spend data
- `GET /api/analytics/category-breakdown` - Category breakdown
- `GET /api/analytics/subscription-stats` - Subscription statistics

## Project Structure

```
src/
├── config/           # Configuration
├── modules/          # Feature modules
│   ├── auth/         # Authentication
│   ├── subscription/ # Subscription management
│   ├── reminder/     # Reminder engine
│   ├── billing/     # Payment tracking
│   ├── detection/   # SMS/Email parsing
│   ├── analytics/   # Analytics
│   └── notification/# Notification service
├── workers/          # Background workers
├── shared/
│   ├── errors/      # Custom errors
│   ├── middleware/ # Express middleware
│   ├── types/       # TypeScript types
│   └── utils/       # Utilities
└── index.ts         # Application entry
```

## Testing

```bash
# Run all tests
npm test

# Run in watch mode
npm run test:watch
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| DATABASE_URL | PostgreSQL connection string | postgresql://... |
| REDIS_HOST | Redis host | localhost |
| REDIS_PORT | Redis port | 6379 |
| JWT_ACCESS_SECRET | JWT access token secret | - |
| JWT_REFRESH_SECRET | JWT refresh token secret | - |

## License

MIT