
-- Create user_settings table
CREATE TABLE public.user_settings (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  business_name TEXT,
  gst_number TEXT,
  address TEXT,
  bank_details JSONB DEFAULT '{"upi": "", "account": "", "ifsc": ""}',
  default_currency TEXT DEFAULT 'INR',
  tax_regime TEXT DEFAULT 'NotSure' CHECK (tax_regime IN ('44ADA', 'Regular', 'NotSure')),
  quarterly_reminder BOOLEAN DEFAULT false,
  proposal_tips_optin BOOLEAN DEFAULT true,
  tax_reminder_optin BOOLEAN DEFAULT true,
  invoice_alerts_optin BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create billing_info table
CREATE TABLE public.billing_info (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  current_plan TEXT DEFAULT 'starter' CHECK (current_plan IN ('starter', 'pro')),
  usage_proposals INTEGER DEFAULT 0,
  usage_followups INTEGER DEFAULT 0,
  renewal_date TIMESTAMP WITH TIME ZONE,
  razorpay_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add profile_picture and login_method to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN profile_picture TEXT,
ADD COLUMN login_method TEXT DEFAULT 'email';

-- Enable RLS on new tables
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_info ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_settings
CREATE POLICY "Users can view their own settings" 
  ON public.user_settings 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" 
  ON public.user_settings 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" 
  ON public.user_settings 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings" 
  ON public.user_settings 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS policies for billing_info
CREATE POLICY "Users can view their own billing info" 
  ON public.billing_info 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own billing info" 
  ON public.billing_info 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own billing info" 
  ON public.billing_info 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true);

-- RLS policies for avatars bucket
CREATE POLICY "Users can view any avatar" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" 
  ON storage.objects 
  FOR UPDATE 
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar" 
  ON storage.objects 
  FOR DELETE 
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Function to automatically create user settings when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Create trigger for new user settings
CREATE OR REPLACE TRIGGER on_auth_user_created_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_settings();

-- Function to export user data
CREATE OR REPLACE FUNCTION public.export_user_data(user_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_data JSONB;
BEGIN
  -- Check if user is requesting their own data
  IF auth.uid() != user_uuid THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- Collect all user data
  SELECT jsonb_build_object(
    'profile', (SELECT row_to_json(p) FROM user_profiles p WHERE id = user_uuid),
    'settings', (SELECT row_to_json(s) FROM user_settings s WHERE user_id = user_uuid),
    'billing', (SELECT row_to_json(b) FROM billing_info b WHERE user_id = user_uuid),
    'proposals', (SELECT json_agg(p) FROM proposals p WHERE user_id = user_uuid),
    'invoices', (SELECT json_agg(i) FROM invoices i WHERE user_id = user_uuid),
    'followups', (SELECT json_agg(f) FROM followups f JOIN proposals p ON f.proposal_id = p.id WHERE p.user_id = user_uuid),
    'tax_estimations', (SELECT json_agg(t) FROM tax_estimations t WHERE user_id = user_uuid)
  ) INTO user_data;
  
  RETURN user_data;
END;
$$;

-- Function to delete user account and all data
CREATE OR REPLACE FUNCTION public.delete_user_account(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is deleting their own account
  IF auth.uid() != user_uuid THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- Delete all user data in proper order
  DELETE FROM public.followups WHERE proposal_id IN (SELECT id FROM proposals WHERE user_id = user_uuid);
  DELETE FROM public.proposals WHERE user_id = user_uuid;
  DELETE FROM public.invoices WHERE user_id = user_uuid;
  DELETE FROM public.tax_estimations WHERE user_id = user_uuid;
  DELETE FROM public.usage_stats WHERE user_id = user_uuid;
  DELETE FROM public.user_settings WHERE user_id = user_uuid;
  DELETE FROM public.billing_info WHERE user_id = user_uuid;
  DELETE FROM public.user_profiles WHERE id = user_uuid;
  
  RETURN TRUE;
END;
$$;
