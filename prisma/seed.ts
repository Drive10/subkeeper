import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SEED_USER = {
  email: 'demo@subsense.io',
  password: 'demo123456',
};

const SEED_SUBSCRIPTIONS = [
  {
    name: 'Netflix',
    amount: 499,
    currency: 'INR',
    billingCycle: 'monthly' as const,
    intervalCount: 1,
    category: 'Entertainment',
    description: 'Premium 4K plan',
    daysUntilBilling: 5,
  },
  {
    name: 'Spotify Premium',
    amount: 199,
    currency: 'INR',
    billingCycle: 'monthly' as const,
    intervalCount: 1,
    category: 'Entertainment',
    description: 'Individual plan',
    daysUntilBilling: 12,
  },
  {
    name: 'Amazon Prime',
    amount: 1499,
    currency: 'INR',
    billingCycle: 'yearly' as const,
    intervalCount: 1,
    category: 'Shopping',
    description: 'Annual membership',
    daysUntilBilling: 45,
  },
  {
    name: 'Disney+ Hotstar',
    amount: 899,
    currency: 'INR',
    billingCycle: 'yearly' as const,
    intervalCount: 1,
    category: 'Entertainment',
    description: 'Premium annual',
    daysUntilBilling: 60,
  },
  {
    name: 'YouTube Premium',
    amount: 139,
    currency: 'INR',
    billingCycle: 'monthly' as const,
    intervalCount: 1,
    category: 'Entertainment',
    description: 'Monthly subscription',
    daysUntilBilling: 18,
  },
  {
    name: 'Gym Membership',
    amount: 1500,
    currency: 'INR',
    billingCycle: 'monthly' as const,
    intervalCount: 1,
    category: 'Health & Fitness',
    description: 'Local gym - monthly',
    daysUntilBilling: 3,
  },
  {
    name: 'Cloud Storage',
    amount: 139,
    currency: 'USD',
    billingCycle: 'monthly' as const,
    intervalCount: 1,
    category: 'Technology',
    description: '2TB cloud storage',
    daysUntilBilling: 25,
  },
  {
    name: 'Notion',
    amount: 800,
    currency: 'INR',
    billingCycle: 'yearly' as const,
    intervalCount: 1,
    category: 'Productivity',
    description: 'Pro plan annual',
    daysUntilBilling: 90,
  },
];

async function seed() {
  console.log('🌱 Starting database seed...\n');

  try {
    console.log('👤 Creating demo user...');
    const passwordHash = await bcrypt.hash(SEED_USER.password, 12);
    
    const user = await prisma.user.upsert({
      where: { email: SEED_USER.email },
      update: {},
      create: {
        email: SEED_USER.email,
        passwordHash,
      },
    });
    console.log(`   ✅ User created: ${user.email}\n`);

    console.log('📺 Creating subscription data...');
    for (const sub of SEED_SUBSCRIPTIONS) {
      const nextBillingDate = new Date();
      nextBillingDate.setDate(nextBillingDate.getDate() + sub.daysUntilBilling);
      
      const lastBillingDate = new Date();
      lastBillingDate.setDate(lastBillingDate.getDate() - (30 - sub.daysUntilBilling));

      await prisma.subscription.upsert({
        where: {
          id: `${user.id}-${sub.name.toLowerCase().replace(/\s+/g, '-')}`,
        },
        update: {},
        create: {
          id: `${user.id}-${sub.name.toLowerCase().replace(/\s+/g, '-')}`,
          userId: user.id,
          name: sub.name,
          amount: sub.amount,
          currency: sub.currency,
          billingCycle: sub.billingCycle,
          intervalCount: sub.intervalCount,
          nextBillingDate,
          lastBillingDate,
          category: sub.category,
          description: sub.description,
          status: 'active',
        },
      });
      console.log(`   ✅ Created: ${sub.name} - ${sub.currency} ${sub.amount}/${sub.billingCycle}`);
    }
    console.log('');

    console.log('💰 Creating payment history...');
    const subscriptions = await prisma.subscription.findMany({
      where: { userId: user.id },
    });

    for (let i = 0; i < 3; i++) {
      for (const sub of subscriptions.slice(0, 3)) {
        const paymentDate = new Date();
        paymentDate.setDate(paymentDate.getDate() - (i + 1) * 30);

        await prisma.payment.create({
          data: {
            subscriptionId: sub.id,
            userId: user.id,
            amount: sub.amount,
            currency: sub.currency,
            paymentDate,
            status: 'completed',
            source: 'auto-detected',
          },
        });
      }
    }
    console.log('   ✅ Payment history created\n');

    console.log('🔔 Creating detection logs...');
    const sampleSmsTexts = [
      'Your Netflix subscription of ₹499 has been charged to your card',
      'Spotify Premium ₹199 debited from your account - renewal confirmed',
      'Amazon Prime membership renewed for ₹1499',
    ];

    for (const text of sampleSmsTexts) {
      await prisma.detectionLog.create({
        data: {
          userId: user.id,
          rawText: text,
          parsedData: {
            name: text.split(' ')[1],
            amount: parseInt(text.match(/₹(\d+)/)?.[1] || '0'),
            confidence: 75,
          },
          confidenceScore: 75,
          status: 'confirmed',
        },
      });
    }
    console.log('   ✅ Detection logs created\n');

    console.log('🎉 Seed completed successfully!\n');
    console.log('📋 Demo credentials:');
    console.log(`   Email: ${SEED_USER.email}`);
    console.log(`   Password: ${SEED_USER.password}\n`);
    console.log('🔗 API Documentation: http://localhost:3000/api-docs');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();