
-- Add necessary columns to billing_info for Razorpay integration
ALTER TABLE public.billing_info
  ADD COLUMN IF NOT EXISTS razorpay_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'expired', 'cancelled')),
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP;

-- If you have test data, you may want to set subscription_status='active' for current active users.
