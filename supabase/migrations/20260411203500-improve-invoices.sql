
-- Add notes column to invoices table
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add unique constraint to invoice_number per user
CREATE UNIQUE INDEX IF NOT EXISTS unique_invoice_number_per_user ON public.invoices (user_id, invoice_number);

-- Create storage bucket for invoices if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('invoices', 'invoices', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for invoices bucket
-- Allow public read access to invoices (since we share the URL)
CREATE POLICY "Public Access" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'invoices');

-- Allow authenticated users to upload to the invoices bucket
CREATE POLICY "Users can upload invoices" 
  ON storage.objects FOR INSERT 
  TO authenticated 
  WITH CHECK (bucket_id = 'invoices');

-- Allow users to delete their own invoices
CREATE POLICY "Users can delete own invoices" 
  ON storage.objects FOR DELETE 
  TO authenticated 
  USING (bucket_id = 'invoices' AND (storage.foldername(name))[1] = auth.uid()::text);
