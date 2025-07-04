-- Fix existing pro users without proper period end dates
UPDATE billing_info 
SET 
  current_period_end = NOW() + INTERVAL '30 days',
  renewal_date = NOW() + INTERVAL '30 days',
  updated_at = NOW()
WHERE current_plan = 'pro' 
  AND subscription_status = 'active' 
  AND current_period_end IS NULL;