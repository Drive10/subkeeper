# Subscription Manager Elite (SubSense)

A production-ready subscription intelligence platform for tracking, detecting, and optimizing recurring payments.

## Features

- **Subscription Management**: Full CRUD operations for subscriptions with multiple billing cycles
- **Smart Detection**: SMS/Email parsing to automatically detect subscriptions
- **Reminder Engine**: Automated reminders (T-3, T-1, T-0) for upcoming renewals
- **Analytics Dashboard**: Monthly spend tracking, category breakdown, unused subscription detection
- **Payment Tracking**: Record and track payment history
- **RESTful API**: Complete API with authentication and rate limiting
- **Real-time Updates**: WebSocket support for live notifications
- **Interactive Docs**: Swagger/OpenAPI documentation
- **React Frontend**: Modern UI with dashboard, analytics, and subscription management

## Tech Stack

### Backend
- **Runtime**: Node.js 20+ with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Cache/Queue**: Redis with BullMQ
- **Validation**: Zod
- **Authentication**: JWT (access + refresh tokens)
- **Real-time**: Socket.IO
- **API Docs**: Swagger UI
- **Testing**: Jest

### Frontend
- **Framework**: React 18 with TypeScript
- **UI**: Material UI (MUI)
- **Charts**: Recharts
- **State**: React Context
- **Real-time**: Socket.IO Client

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+

### Backend Setup

```bash
# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed demo data (optional)
npm run seed

# Start development server
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

### Docker Setup

```bash
docker-compose up
```

## API Documentation

Once the server is running, visit: **http://localhost:3000/api-docs**

## Demo Credentials

After running `npm run seed`:
- **Email**: demo@subsense.io
- **Password**: demo123456

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
- `GET /api/subscriptions/upcoming` - Upcoming renewals

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
- `GET /api/detect/logs` - Detection logs

### Analytics
- `GET /api/analytics/monthly-spend` - Monthly spend data
- `GET /api/analytics/category-breakdown` - Category breakdown
- `GET /api/analytics/subscription-stats` - Subscription statistics
- `GET /api/analytics/upcoming-renewals` - Upcoming renewals
- `GET /api/analytics/total-monthly-spend` - Total monthly spend
- `GET /api/analytics/unused-subscriptions` - Unused subscriptions

## Health Check

```bash
GET /health
```

Returns database, Redis, and WebSocket status.

## Project Structure

```
├── src/                    # Backend source
│   ├── config/            # Configuration
│   ├── modules/           # Feature modules
│   │   ├── auth/         # Authentication
│   │   ├── subscription/ # Subscription management
│   │   ├── reminder/     # Reminder engine
│   │   ├── billing/      # Payment tracking
│   │   ├── detection/    # SMS/Email parsing
│   │   ├── analytics/    # Analytics
│   │   └── notification/ # Notification service
│   ├── workers/          # Background workers
│   └── shared/           # Shared utilities
├── frontend/              # React frontend
│   └── src/
│       ├── components/  # UI components
│       ├── pages/       # Page components
│       ├── services/    # API services
│       ├── context/     # React contexts
│       └── hooks/       # Custom hooks
├── prisma/               # Database schema & seeds
└── tests/                # Backend tests
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