-- Fix security definer functions by adding SET search_path = ''
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.user_profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''));
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Insert into user_settings
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Insert into billing_info
  INSERT INTO public.billing_info (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_or_create_usage_stats(user_uuid uuid)
RETURNS usage_stats
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  current_month DATE := date_trunc('month', CURRENT_DATE)::DATE;
  stats_record public.usage_stats;
BEGIN
  SELECT * INTO stats_record
  FROM public.usage_stats
  WHERE user_id = user_uuid AND month = current_month;
  
  IF NOT FOUND THEN
    INSERT INTO public.usage_stats (user_id, month)
    VALUES (user_uuid, current_month)
    RETURNING * INTO stats_record;
  END IF;
  
  RETURN stats_record;
END;
$function$;

CREATE OR REPLACE FUNCTION public.export_user_data(user_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  user_data JSONB;
BEGIN
  -- Check if user is requesting their own data
  IF auth.uid() != user_uuid THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- Collect all user data
  SELECT jsonb_build_object(
    'profile', (SELECT row_to_json(p) FROM public.user_profiles p WHERE id = user_uuid),
    'settings', (SELECT row_to_json(s) FROM public.user_settings s WHERE user_id = user_uuid),
    'billing', (SELECT row_to_json(b) FROM public.billing_info b WHERE user_id = user_uuid),
    'proposals', (SELECT json_agg(p) FROM public.proposals p WHERE user_id = user_uuid),
    'invoices', (SELECT json_agg(i) FROM public.invoices i WHERE user_id = user_uuid),
    'followups', (SELECT json_agg(f) FROM public.followups f JOIN public.proposals p ON f.proposal_id = p.id WHERE p.user_id = user_uuid),
    'tax_estimations', (SELECT json_agg(t) FROM public.tax_estimations t WHERE user_id = user_uuid)
  ) INTO user_data;
  
  RETURN user_data;
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_user_account(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Check if user is deleting their own account
  IF auth.uid() != user_uuid THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- Delete all user data in proper order
  DELETE FROM public.followups WHERE proposal_id IN (SELECT id FROM public.proposals WHERE user_id = user_uuid);
  DELETE FROM public.proposals WHERE user_id = user_uuid;
  DELETE FROM public.invoices WHERE user_id = user_uuid;
  DELETE FROM public.tax_estimations WHERE user_id = user_uuid;
  DELETE FROM public.usage_stats WHERE user_id = user_uuid;
  DELETE FROM public.user_settings WHERE user_id = user_uuid;
  DELETE FROM public.billing_info WHERE user_id = user_uuid;
  DELETE FROM public.user_profiles WHERE id = user_uuid;
  DELETE FROM public.ai_usage_logs WHERE user_id = user_uuid;
  
  RETURN TRUE;
END;
$function$;

-- Enable RLS on ai_usage_logs table
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ai_usage_logs
CREATE POLICY "Users can view own AI usage logs"
ON public.ai_usage_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI usage logs"
ON public.ai_usage_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Remove duplicate RLS policies on usage_stats (keeping the more descriptive ones)
DROP POLICY IF EXISTS "User can insert own usage_stats" ON public.usage_stats;
DROP POLICY IF EXISTS "User can read their usage_stats" ON public.usage_stats;
DROP POLICY IF EXISTS "User can update own usage_stats" ON public.usage_stats;