-- Fix function search path security issue
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Move vector extension to extensions schema (safer)
DROP EXTENSION IF EXISTS vector;
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;