-- ====================================================================
-- CAPITOL RADAR ENGINE SCHEMA EXTENSION (WITH SECURITY DEFINER RPCs)
-- Copy and paste this script directly into your Supabase SQL Editor.
-- ====================================================================

-- 1. Create system_config Table (single row to store AI weights)
CREATE TABLE IF NOT EXISTS public.system_config (
    id INT PRIMARY KEY CHECK (id = 1),
    political_weight NUMERIC(4,2) NOT NULL DEFAULT 0.35,
    momentum_weight NUMERIC(4,2) NOT NULL DEFAULT 0.35,
    sentiment_weight NUMERIC(4,2) NOT NULL DEFAULT 0.20,
    catalyst_weight NUMERIC(4,2) NOT NULL DEFAULT 0.10,
    last_optimized_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    optimization_log TEXT DEFAULT 'Initial weights established.'
);

-- Seed system_config
INSERT INTO public.system_config (id, political_weight, momentum_weight, sentiment_weight, catalyst_weight)
VALUES (1, 0.35, 0.35, 0.20, 0.10)
ON CONFLICT (id) DO NOTHING;

-- 2. Create daily_top_picks Table
CREATE TABLE IF NOT EXISTS public.daily_top_picks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticker TEXT NOT NULL,
    company_name TEXT NOT NULL,
    conviction_score NUMERIC(5,2) NOT NULL,
    momentum_metrics JSONB NOT NULL, -- {1d: x, 7d: y, 15d: z, 30d: w}
    news_sentiment_score NUMERIC(4,2) NOT NULL,
    upcoming_catalyst TEXT,
    rationale_summary TEXT NOT NULL,
    generated_date DATE NOT NULL DEFAULT CURRENT_DATE,
    position_size NUMERIC(5,2) NOT NULL DEFAULT 5.00,
    stop_loss NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_ticker_date UNIQUE (ticker, generated_date)
);

-- Create index on daily_top_picks dates
CREATE INDEX IF NOT EXISTS idx_daily_top_picks_date ON public.daily_top_picks(generated_date DESC);

-- 3. Create portfolio_tracker Table
CREATE TABLE IF NOT EXISTS public.portfolio_tracker (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticker TEXT NOT NULL,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    entry_price NUMERIC(10,2) NOT NULL,
    current_status TEXT NOT NULL CHECK (current_status IN ('Hold', 'Sell')),
    exit_date DATE,
    exit_price NUMERIC(10,2),
    exit_reason TEXT,
    position_size NUMERIC(5,2) NOT NULL DEFAULT 5.00,
    stop_loss NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index on portfolio_tracker status
CREATE INDEX IF NOT EXISTS idx_portfolio_tracker_status ON public.portfolio_tracker(current_status);

-- 4. Create accuracy_ledger Table
CREATE TABLE IF NOT EXISTS public.accuracy_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recommendation_date DATE NOT NULL,
    ticker TEXT NOT NULL,
    entry_price NUMERIC(10,2) NOT NULL,
    open_price NUMERIC(10,2),
    high_price NUMERIC(10,2),
    low_price NUMERIC(10,2),
    close_price NUMERIC(10,2),
    perf_1d NUMERIC(6,2),
    perf_7d NUMERIC(6,2),
    perf_15d NUMERIC(6,2),
    perf_30d NUMERIC(6,2),
    is_winner BOOLEAN,
    evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index on accuracy_ledger recommendation_date
CREATE INDEX IF NOT EXISTS idx_accuracy_ledger_date ON public.accuracy_ledger(recommendation_date DESC);

-- Enable RLS Policies
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_top_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accuracy_ledger ENABLE ROW LEVEL SECURITY;

-- Select rules: Allow anyone (authenticated or anonymous guests) to read the tables
DROP POLICY IF EXISTS "Allow read system_config" ON public.system_config;
CREATE POLICY "Allow read system_config" ON public.system_config FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow read daily_top_picks" ON public.daily_top_picks;
CREATE POLICY "Allow read daily_top_picks" ON public.daily_top_picks FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow read portfolio_tracker" ON public.portfolio_tracker;
CREATE POLICY "Allow read portfolio_tracker" ON public.portfolio_tracker FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow read accuracy_ledger" ON public.accuracy_ledger;
CREATE POLICY "Allow read accuracy_ledger" ON public.accuracy_ledger FOR SELECT TO public USING (true);

-- Write/Modify access rules: Reserved for admin clients
DROP POLICY IF EXISTS "Allow write system_config for admins" ON public.system_config;
CREATE POLICY "Allow write system_config for admins" ON public.system_config
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.clients
            WHERE clients.id = auth.uid() AND clients.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Allow write daily_top_picks for admins" ON public.daily_top_picks;
CREATE POLICY "Allow write daily_top_picks for admins" ON public.daily_top_picks
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.clients
            WHERE clients.id = auth.uid() AND clients.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Allow write portfolio_tracker for admins" ON public.portfolio_tracker;
CREATE POLICY "Allow write portfolio_tracker for admins" ON public.portfolio_tracker
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.clients
            WHERE clients.id = auth.uid() AND clients.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Allow write accuracy_ledger for admins" ON public.accuracy_ledger;
CREATE POLICY "Allow write accuracy_ledger for admins" ON public.accuracy_ledger
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.clients
            WHERE clients.id = auth.uid() AND clients.role = 'admin'
        )
    );

-- ====================================================================
-- SECURITY DEFINER FUNCTION INTERFACES (BYPASS RLS SECURELY FOR CRONS)
-- ====================================================================

-- 1. Get configuration
CREATE OR REPLACE FUNCTION public.rpc_get_system_config()
RETURNS SETOF public.system_config
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY SELECT * FROM public.system_config WHERE id = 1;
END;
$$;

-- 2. Update config weights and log
CREATE OR REPLACE FUNCTION public.rpc_update_system_config(
    p_political NUMERIC,
    p_momentum NUMERIC,
    p_sentiment NUMERIC,
    p_catalyst NUMERIC,
    p_log TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.system_config
    SET 
        political_weight = p_political,
        momentum_weight = p_momentum,
        sentiment_weight = p_sentiment,
        catalyst_weight = p_catalyst,
        optimization_log = p_log,
        last_optimized_at = timezone('utc'::text, now())
    WHERE id = 1;
END;
$$;

-- 3. Bulk upsert daily top picks
CREATE OR REPLACE FUNCTION public.rpc_upsert_daily_top_picks(picks_json jsonb)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    pick_rec jsonb;
BEGIN
    FOR pick_rec IN SELECT * FROM jsonb_array_elements(picks_json)
    LOOP
        INSERT INTO public.daily_top_picks (
            ticker, company_name, conviction_score, momentum_metrics, 
            news_sentiment_score, upcoming_catalyst, rationale_summary, 
            generated_date, position_size, stop_loss
        ) VALUES (
            pick_rec->>'ticker',
            pick_rec->>'company_name',
            (pick_rec->>'conviction_score')::numeric,
            (pick_rec->'momentum_metrics'),
            (pick_rec->>'news_sentiment_score')::numeric,
            pick_rec->>'upcoming_catalyst',
            pick_rec->>'rationale_summary',
            (pick_rec->>'generated_date')::date,
            (pick_rec->>'position_size')::numeric,
            (pick_rec->>'stop_loss')::numeric
        )
        ON CONFLICT (ticker, generated_date) 
        DO UPDATE SET
            conviction_score = EXCLUDED.conviction_score,
            momentum_metrics = EXCLUDED.momentum_metrics,
            news_sentiment_score = EXCLUDED.news_sentiment_score,
            upcoming_catalyst = EXCLUDED.upcoming_catalyst,
            rationale_summary = EXCLUDED.rationale_summary,
            position_size = EXCLUDED.position_size,
            stop_loss = EXCLUDED.stop_loss;
    END LOOP;
END;
$$;

-- 4. Bulk upsert portfolio tracker items
CREATE OR REPLACE FUNCTION public.rpc_upsert_portfolio_tracker(positions_json jsonb)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    pos_rec jsonb;
BEGIN
    FOR pos_rec IN SELECT * FROM jsonb_array_elements(positions_json)
    LOOP
        INSERT INTO public.portfolio_tracker (
            ticker, entry_date, entry_price, current_status, exit_date, exit_price, exit_reason, position_size, stop_loss
        ) VALUES (
            pos_rec->>'ticker',
            (pos_rec->>'entry_date')::date,
            (pos_rec->>'entry_price')::numeric,
            pos_rec->>'current_status',
            (pos_rec->>'exit_date')::date,
            (pos_rec->>'exit_price')::numeric,
            pos_rec->>'exit_reason',
            (pos_rec->>'position_size')::numeric,
            (pos_rec->>'stop_loss')::numeric
        );
    END LOOP;
END;
$$;

-- 5. Close a portfolio position
CREATE OR REPLACE FUNCTION public.rpc_close_portfolio_position(
    p_id UUID,
    p_exit_price NUMERIC,
    p_exit_date DATE,
    p_exit_reason TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.portfolio_tracker
    SET
        current_status = 'Sell',
        exit_price = p_exit_price,
        exit_date = p_exit_date,
        exit_reason = p_exit_reason
    WHERE id = p_id;
END;
$$;

-- 6. Insert accuracy ledger logs
CREATE OR REPLACE FUNCTION public.rpc_insert_accuracy_ledger(records_json jsonb)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    rec jsonb;
BEGIN
    FOR rec IN SELECT * FROM jsonb_array_elements(records_json)
    LOOP
        INSERT INTO public.accuracy_ledger (
            recommendation_date, ticker, entry_price, open_price, high_price, 
            low_price, close_price, perf_1d, perf_7d, perf_15d, perf_30d, is_winner
        ) VALUES (
            (rec->>'recommendation_date')::date,
            rec->>'ticker',
            (rec->>'entry_price')::numeric,
            (rec->>'open_price')::numeric,
            (rec->>'high_price')::numeric,
            (rec->>'low_price')::numeric,
            (rec->>'close_price')::numeric,
            (rec->>'perf_1d')::numeric,
            (rec->>'perf_7d')::numeric,
            (rec->>'perf_15d')::numeric,
            (rec->>'perf_30d')::numeric,
            (rec->>'is_winner')::boolean
        );
    END LOOP;
END;
$$;
