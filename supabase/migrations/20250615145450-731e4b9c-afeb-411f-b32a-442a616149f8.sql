
-- Add "status" and "payment_status" (paid/unpaid) to invoices table
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',         -- DRAFT, PENDING, OVERDUE, SCHEDULED, PAID
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid';  -- 'paid', 'unpaid'

-- Optional: update historical invoices with derived status if relevant (manual step)
