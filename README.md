# SubSense - Subscription Manager

A full-stack subscription tracking application built with NestJS (backend) and Next.js 14 (frontend).

## Tech Stack

- **Backend**: NestJS, Prisma, PostgreSQL, JWT Auth
- **Frontend**: Next.js 14 (App Router), Tailwind CSS, ShadCN UI, Recharts

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Database Setup

1. Create a PostgreSQL database:

```sql
CREATE DATABASE subscription_manager;
```

2. Update the connection string in `backend-nest/.env`:

```
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/subscription_manager"
```

3. Run migrations:

```bash
cd backend-nest
npx prisma migrate dev --name init
```

### Backend Setup

```bash
cd backend-nest
npm install
npm run start:dev
```

API runs at `http://localhost:3001/api`

### Frontend Setup

```bash
cd frontend-next
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`

## API Endpoints

### Auth

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Subscriptions

- `GET /api/subscriptions` - List subscriptions
- `POST /api/subscriptions` - Create subscription
- `GET /api/subscriptions/:id` - Get subscription
- `PATCH /api/subscriptions/:id` - Update subscription
- `DELETE /api/subscriptions/:id` - Delete subscription
- `POST /api/subscriptions/:id/pause` - Pause subscription
- `POST /api/subscriptions/:id/resume` - Resume subscription
- `GET /api/subscriptions/upcoming` - Upcoming renewals

### Analytics

- `GET /api/analytics/monthly-spend` - Monthly spend
- `GET /api/analytics/category-breakdown` - Category breakdown
- `GET /api/analytics/subscription-stats` - Subscription stats
- `GET /api/analytics/total-monthly-spend` - Total monthly spend

### Payments

- `GET /api/payments` - List payments
- `POST /api/payments` - Create payment

### Detection

- `POST /api/detect/sms` - Detect from SMS
- `POST /api/detect/confirm` - Confirm detection
- `GET /api/detect/logs` - Get detection logs

### Reminders

- `GET /api/reminders/:subscriptionId` - Get reminders
- `POST /api/reminders` - Create reminder
- `DELETE /api/reminders/:id` - Cancel reminder

## Project Structure

```
backend-nest/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   ├── subscription/
│   │   ├── analytics/
│   │   ├── billing/
│   │   ├── detection/
│   │   └── reminder/
│   └── prisma/
│       └── schema.prisma

frontend-next/
├── src/
│   ├── app/
│   │   ├── login/
│   │   ├── register/
│   │   ├── dashboard/
│   │   ├── subscriptions/
│   │   └── analytics/
│   ├── components/ui/
│   └── lib/
```

## License

MIT
