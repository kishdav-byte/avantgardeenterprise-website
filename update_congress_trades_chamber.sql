-- Run this query in your Supabase SQL Editor:
ALTER TABLE public.congress_trades DROP CONSTRAINT IF EXISTS congress_trades_chamber_check;

ALTER TABLE public.congress_trades ADD CONSTRAINT congress_trades_chamber_check CHECK (chamber IN ('House', 'Senate', 'Executive'));
