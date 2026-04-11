
-- Add notes column to invoices table
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add unique constraint to invoice_number per user
-- First, handle existing duplicates if any (unlikely in a clean env but good practice)
-- For now, we'll just add the constraint and it will fail if duplicates exist.
-- To be safe, we can use a unique index instead.
CREATE UNIQUE INDEX IF NOT EXISTS unique_invoice_number_per_user ON public.invoices (user_id, invoice_number);
