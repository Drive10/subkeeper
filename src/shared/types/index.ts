export type BillingCycle = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'expired';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type ReminderType = 'pre_reminder' | 'on_due' | 'overdue';
export type ReminderStatus = 'pending' | 'sent' | 'failed' | 'cancelled';
export type DetectionStatus = 'pending' | 'matched' | 'unmatched' | 'confirmed' | 'rejected';