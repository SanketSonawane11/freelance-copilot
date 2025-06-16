
-- Update the check constraint for billing_info to allow the correct plan names
ALTER TABLE public.billing_info 
DROP CONSTRAINT IF EXISTS billing_info_current_plan_check;

ALTER TABLE public.billing_info 
ADD CONSTRAINT billing_info_current_plan_check 
CHECK (current_plan IN ('starter', 'basic', 'pro'));
