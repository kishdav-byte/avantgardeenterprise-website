-- ====================================================================
-- CAPITOL RADAR DATABASE MIGRATION SCRIPT
-- Copy and paste this script directly into your Supabase SQL Editor.
-- ====================================================================

-- 1. EXTEND THE CLIENTS SCHEMA FOR ALERT REGISTRATION
-- Add phone number and alert preferences to client profiles
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS sms_alerts_enabled BOOLEAN DEFAULT false;

-- 2. CREATE POLITICIAN COMMITTEES LOOKUP TABLE
-- Maps members to key industry-influencing committees
DROP TABLE IF EXISTS public.politician_committees CASCADE;
CREATE TABLE public.politician_committees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    politician_name TEXT UNIQUE NOT NULL,
    committees TEXT[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed high-profile politicians & their key committee alignments
INSERT INTO public.politician_committees (politician_name, committees) VALUES
('Nancy Pelosi', ARRAY['Financial Services', 'Technology']),
('Tommy Tuberville', ARRAY['Armed Services', 'Agriculture', 'Finance']),
('Markwayne Mullin', ARRAY['Armed Services', 'Health', 'Energy']),
('Ro Khanna', ARRAY['Armed Services', 'Technology']),
('Josh Gottheimer', ARRAY['Financial Services', 'Intelligence']),
('Michael Guest', ARRAY['Ethics', 'Homeland Security', 'Transportation']),
('Dan Crenshaw', ARRAY['Energy and Commerce']),
('Rick Scott', ARRAY['Armed Services', 'Finance']),
('Sheldon Whitehouse', ARRAY['Finance', 'Judiciary', 'Environment']),
('John Fetterman', ARRAY['Agriculture', 'Banking', 'Environment']),
('Pat Toomey', ARRAY['Banking', 'Finance']),
('Richard Burr', ARRAY['Health', 'Finance']),
('Marjorie Taylor Greene', ARRAY['Homeland Security', 'Oversight']),
('Diana Harshbarger', ARRAY['Energy and Commerce']),
('Daniel Goldman', ARRAY['Homeland Security', 'Oversight']),
('Jared Moskowitz', ARRAY['Homeland Security', 'Foreign Affairs']),
('Thomas Carper', ARRAY['Finance', 'Environment'])
ON CONFLICT (politician_name) DO UPDATE SET committees = EXCLUDED.committees;

-- 3. CREATE CONGRESS TRADES STORAGE TABLE
DROP TABLE IF EXISTS public.congress_trades CASCADE;
CREATE TABLE public.congress_trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    politician_name TEXT NOT NULL,
    chamber TEXT NOT NULL CHECK (chamber IN ('House', 'Senate', 'Executive')),
    party TEXT NOT NULL,
    ticker TEXT NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('Purchase', 'Sale', 'Exchange')),
    amount_range TEXT,
    transaction_date DATE,
    filing_date DATE,
    committee_overlap BOOLEAN DEFAULT false,
    is_notified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_trade UNIQUE (politician_name, ticker, transaction_date, transaction_type, amount_range)
);

-- Indexes for lightning-fast dashboard queries
CREATE INDEX IF NOT EXISTS idx_congress_trades_representative ON public.congress_trades(politician_name);
CREATE INDEX IF NOT EXISTS idx_congress_trades_ticker ON public.congress_trades(ticker);
CREATE INDEX IF NOT EXISTS idx_congress_trades_overlap ON public.congress_trades(committee_overlap);
CREATE INDEX IF NOT EXISTS idx_congress_trades_dates ON public.congress_trades(filing_date DESC, transaction_date DESC);

-- 4. CONFIGURE ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.congress_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.politician_committees ENABLE ROW LEVEL SECURITY;

-- Select rules: Allow anyone (authenticated or anonymous guests) to fetch trades & committees
DROP POLICY IF EXISTS "Allow read access for authenticated users table" ON public.congress_trades;
CREATE POLICY "Allow read access for authenticated users table" ON public.congress_trades
    FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow read access for authenticated users committees" ON public.politician_committees;
CREATE POLICY "Allow read access for authenticated users committees" ON public.politician_committees
    FOR SELECT TO public USING (true);

-- Insert/Upsert/Update policies: Reserved for Service Role & Administrators
DROP POLICY IF EXISTS "Allow write access for admin on trades" ON public.congress_trades;
CREATE POLICY "Allow write access for admin on trades" ON public.congress_trades
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.clients
            WHERE clients.id = auth.uid() AND clients.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Allow write access for admin on committees" ON public.politician_committees;
CREATE POLICY "Allow write access for admin on committees" ON public.politician_committees
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.clients
            WHERE clients.id = auth.uid() AND clients.role = 'admin'
        )
    );

-- 5. FUNCTION TO UPSERT CONGRESS TRADES (SECURITY DEFINER)
-- Bypasses RLS to allow backend ingestion cron job processing.
CREATE OR REPLACE FUNCTION public.upsert_congress_trades_json(trades_json jsonb)
RETURNS TABLE(inserted_count int, overlap_count int)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    trade_record jsonb;
    ins_count int := 0;
    ov_count int := 0;
    p_name text;
    p_chamber text;
    p_party text;
    p_ticker text;
    p_trans_type text;
    p_amount_range text;
    p_trans_date date;
    p_filing_date date;
    p_overlap boolean;
BEGIN
    FOR trade_record IN SELECT * FROM jsonb_array_elements(trades_json)
    LOOP
        p_name := trade_record->>'politician_name';
        p_chamber := trade_record->>'chamber';
        p_party := trade_record->>'party';
        p_ticker := trade_record->>'ticker';
        p_trans_type := trade_record->>'transaction_type';
        p_amount_range := trade_record->>'amount_range';
        p_trans_date := (trade_record->>'transaction_date')::date;
        p_filing_date := (trade_record->>'filing_date')::date;
        p_overlap := (trade_record->>'committee_overlap')::boolean;

        -- Perform upsert using values
        INSERT INTO public.congress_trades (
            politician_name, chamber, party, ticker, transaction_type, amount_range, transaction_date, filing_date, committee_overlap
        ) VALUES (
            p_name, p_chamber, p_party, p_ticker, p_trans_type, p_amount_range, p_trans_date, p_filing_date, p_overlap
        )
        ON CONFLICT (politician_name, ticker, transaction_date, transaction_type, amount_range) 
        DO UPDATE SET 
            committee_overlap = EXCLUDED.committee_overlap,
            updated_at = timezone('utc'::text, now())
        WHERE congress_trades.committee_overlap != EXCLUDED.committee_overlap OR congress_trades.id IS NOT NULL;

        IF FOUND THEN
            ins_count := ins_count + 1;
            IF p_overlap THEN
                ov_count := ov_count + 1;
            END IF;
        END IF;
    END LOOP;

    RETURN QUERY SELECT ins_count, ov_count;
END;
$$;

-- 6. FUNCTION TO GET AND ATOMICALLY MARK UNNOTIFIED OVERLAPS (SECURITY DEFINER)
-- Fetches and marks newly added trades with committee overlaps.
CREATE OR REPLACE FUNCTION public.get_and_mark_unnotified_overlaps()
RETURNS TABLE (
    id UUID,
    politician_name TEXT,
    chamber TEXT,
    ticker TEXT,
    transaction_type TEXT,
    amount_range TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH targets AS (
        SELECT ct.id, ct.politician_name, ct.chamber, ct.ticker, ct.transaction_type, ct.amount_range
        FROM public.congress_trades ct
        WHERE ct.committee_overlap = true AND ct.is_notified = false
    )
    SELECT * FROM targets;

    -- Mark them as notified
    UPDATE public.congress_trades
    SET is_notified = true, updated_at = timezone('utc'::text, now())
    WHERE committee_overlap = true AND is_notified = false;
END;
$$;

-- 7. FUNCTION TO GET SMS REGISTERED ADMINS (SECURITY DEFINER)
-- Reads admin accounts registered for SMS notifications safely.
CREATE OR REPLACE FUNCTION public.get_sms_registered_admins()
RETURNS TABLE (
    id UUID,
    email TEXT,
    phone_number TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT c.id, c.email, c.phone_number
    FROM public.clients c
    WHERE c.role = 'admin' AND c.sms_alerts_enabled = true AND c.phone_number IS NOT NULL AND c.phone_number != '';
END;
$$;
