-- ====================================================================
-- CAPITOL RADAR PORTFOLIO TRACKING MIGRATION SCRIPT
-- ====================================================================

-- 1. CREATE USER PORTFOLIO TRACKING TABLE
CREATE TABLE IF NOT EXISTS public.user_portfolio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ticker TEXT NOT NULL,
    shares_quantity NUMERIC NOT NULL CHECK (shares_quantity > 0),
    purchase_price NUMERIC NOT NULL CHECK (purchase_price > 0),
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    shadowed_politician TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. CREATE PORTFOLIO ALERTS MANAGEMENT TABLE
CREATE TABLE IF NOT EXISTS public.portfolio_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ticker TEXT NOT NULL,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('Political Sell', 'Bearish Media', 'Stop Loss')),
    severity TEXT NOT NULL CHECK (severity IN ('Critical', 'Warning')),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_portfolio_ticker ON public.user_portfolio(ticker);
CREATE INDEX IF NOT EXISTS idx_user_portfolio_user ON public.user_portfolio(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_alerts_ticker ON public.portfolio_alerts(ticker);
CREATE INDEX IF NOT EXISTS idx_portfolio_alerts_unread ON public.portfolio_alerts(is_read);

-- 3. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.user_portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_alerts ENABLE ROW LEVEL SECURITY;

-- Allow read/write access for all (to support guest sandbox mode and logged in users)
DROP POLICY IF EXISTS "Allow select for all on user_portfolio" ON public.user_portfolio;
CREATE POLICY "Allow select for all on user_portfolio" ON public.user_portfolio FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow insert for all on user_portfolio" ON public.user_portfolio;
CREATE POLICY "Allow insert for all on user_portfolio" ON public.user_portfolio FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update for all on user_portfolio" ON public.user_portfolio;
CREATE POLICY "Allow update for all on user_portfolio" ON public.user_portfolio FOR UPDATE TO public USING (true);

DROP POLICY IF EXISTS "Allow delete for all on user_portfolio" ON public.user_portfolio;
CREATE POLICY "Allow delete for all on user_portfolio" ON public.user_portfolio FOR DELETE TO public USING (true);

-- Repeat for portfolio_alerts
DROP POLICY IF EXISTS "Allow select for all on portfolio_alerts" ON public.portfolio_alerts;
CREATE POLICY "Allow select for all on portfolio_alerts" ON public.portfolio_alerts FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow insert for all on portfolio_alerts" ON public.portfolio_alerts;
CREATE POLICY "Allow insert for all on portfolio_alerts" ON public.portfolio_alerts FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update for all on portfolio_alerts" ON public.portfolio_alerts;
CREATE POLICY "Allow update for all on portfolio_alerts" ON public.portfolio_alerts FOR UPDATE TO public USING (true);

DROP POLICY IF EXISTS "Allow delete for all on portfolio_alerts" ON public.portfolio_alerts;
CREATE POLICY "Allow delete for all on portfolio_alerts" ON public.portfolio_alerts FOR DELETE TO public USING (true);
