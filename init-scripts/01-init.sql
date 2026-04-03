-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing_date ON subscriptions(next_billing_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_reminders_scheduled_at ON reminders(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_reminders_subscription_id ON reminders(subscription_id);
CREATE INDEX IF NOT EXISTS idx_detection_logs_user_id ON detection_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_detection_logs_status ON detection_logs(status);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);

-- Create partial indexes for common queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON subscriptions(user_id, next_billing_date) 
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_payments_completed ON payments(subscription_id, payment_date) 
  WHERE status = 'completed';

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all tables that have the column
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reminders_updated_at
  BEFORE UPDATE ON reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- Create comments for documentation
COMMENT ON TABLE users IS 'User accounts with authentication';
COMMENT ON TABLE subscriptions IS 'User subscription tracking';
COMMENT ON TABLE payments IS 'Payment history for subscriptions';
COMMENT ON TABLE reminders IS 'Scheduled reminder notifications';
COMMENT ON TABLE detection_logs IS 'SMS/Email detection parsing logs';
COMMENT ON TABLE refresh_tokens IS 'JWT refresh tokens for auth';