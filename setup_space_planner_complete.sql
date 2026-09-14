-- ==============================================================================
-- SPACEIQ COMPLETE DATABASE MIGRATION SCRIPT
-- Avant-Garde Enterprise - SpaceIQ Multimodal AI Space Planner
-- 
-- Run this single script in your Supabase SQL Editor:
-- 1. Go to Supabase Dashboard -> SQL Editor
-- 2. Create a "New query"
-- 3. Paste this entire script and click "Run" (CMD + Enter)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. CREDITS & TRANSACTION LEDGER
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.space_planner_credits (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    balance integer NOT NULL DEFAULT 1 CHECK (balance >= 0),
    free_sample_used boolean NOT NULL DEFAULT false,
    lifetime_granted integer NOT NULL DEFAULT 1 CHECK (lifetime_granted >= 0),
    lifetime_used integer NOT NULL DEFAULT 0 CHECK (lifetime_used >= 0),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.space_planner_transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount integer NOT NULL,
    balance_after integer NOT NULL CHECK (balance_after >= 0),
    transaction_type text NOT NULL CHECK (transaction_type IN ('free_grant', 'purchase', 'audit_deduction', 'refund', 'admin_adjustment')),
    description text NOT NULL,
    audit_id uuid,
    stripe_session_id text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 2. AUDITS TABLE (INPUTS & METADATA)
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.space_audits (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE, -- Nullable for anonymous guest micro-audits
    
    -- Context & Room Specification
    space_context text NOT NULL CHECK (space_context IN ('home', 'classroom', 'business')),
    room_type text NOT NULL,
    title text,
    
    -- Goals & Budget
    goals text[] NOT NULL DEFAULT '{}',
    budget_tier text NOT NULL DEFAULT 'medium' CHECK (budget_tier IN ('diy_low', 'medium', 'high', 'open')),
    budget_limit numeric(10, 2),
    
    -- Lifestyle & Environment Metrics
    lifestyle_metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
    
    -- Image References (clutter photos stored in Supabase Storage or inline Data URLs)
    clutter_photos text[] NOT NULL DEFAULT '{}',
    
    -- Guest & Micro-Audit Flags
    is_micro_audit boolean DEFAULT false,
    guest_fingerprint text,
    
    -- State & Credit Tracking
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'queued', 'processing', 'completed', 'failed')),
    is_free_sample boolean NOT NULL DEFAULT false,
    error_message text,
    
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure user_id is nullable if table already existed with NOT NULL constraint
ALTER TABLE public.space_audits ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.space_audits ADD COLUMN IF NOT EXISTS is_micro_audit boolean DEFAULT false;
ALTER TABLE public.space_audits ADD COLUMN IF NOT EXISTS guest_fingerprint text;

-- ------------------------------------------------------------------------------
-- 3. AUDIT RESULTS TABLE (STRUCTURED AI OUTPUT)
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.space_audit_results (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    audit_id uuid REFERENCES public.space_audits(id) ON DELETE CASCADE NOT NULL UNIQUE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE, -- Nullable for guest micro-audits
    
    -- High-level Assessment
    executive_summary text NOT NULL,
    key_pain_points text[] NOT NULL DEFAULT '{}',
    
    -- Phased Action Plan
    phased_steps jsonb NOT NULL DEFAULT '[]'::jsonb,
    
    -- Visual Concept Mockup (DALL-E 3)
    visual_mockup_url text,
    visual_mockup_prompt text,
    
    -- Amazon Affiliate Shopping List
    product_recommendations jsonb NOT NULL DEFAULT '[]'::jsonb,
    
    -- Efficiency & Diagnostic Metrics
    space_metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
    
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure user_id is nullable if table already existed with NOT NULL constraint
ALTER TABLE public.space_audit_results ALTER COLUMN user_id DROP NOT NULL;

-- ------------------------------------------------------------------------------
-- 4. GUEST MICRO-AUDIT RATE LIMIT TRACKING
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.space_planner_guest_usage (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    fingerprint text NOT NULL,
    ip_hash text NOT NULL,
    audit_id uuid REFERENCES public.space_audits(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_space_planner_guest_fingerprint ON public.space_planner_guest_usage(fingerprint);
CREATE INDEX IF NOT EXISTS idx_space_planner_guest_ip ON public.space_planner_guest_usage(ip_hash);
CREATE INDEX IF NOT EXISTS idx_space_audits_user_id ON public.space_audits(user_id);
CREATE INDEX IF NOT EXISTS idx_space_audits_status ON public.space_audits(status);
CREATE INDEX IF NOT EXISTS idx_space_audit_results_audit_id ON public.space_audit_results(audit_id);

-- Foreign key linking transaction to audit
ALTER TABLE public.space_planner_transactions
    DROP CONSTRAINT IF EXISTS fk_space_planner_transactions_audit;
ALTER TABLE public.space_planner_transactions
    ADD CONSTRAINT fk_space_planner_transactions_audit
    FOREIGN KEY (audit_id) REFERENCES public.space_audits(id) ON DELETE SET NULL;

-- ------------------------------------------------------------------------------
-- 5. ATOMIC DATABASE RPC FUNCTIONS
-- ------------------------------------------------------------------------------

-- Ensure user has a credit record (auto-granting initial 1 free sample)
CREATE OR REPLACE FUNCTION public.get_or_create_space_planner_credits(p_user_id uuid)
RETURNS public.space_planner_credits
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_record public.space_planner_credits;
BEGIN
    SELECT * INTO v_record FROM public.space_planner_credits WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        INSERT INTO public.space_planner_credits (user_id, balance, free_sample_used, lifetime_granted, lifetime_used)
        VALUES (p_user_id, 1, false, 1, 0)
        RETURNING * INTO v_record;

        INSERT INTO public.space_planner_transactions (
            user_id,
            amount,
            balance_after,
            transaction_type,
            description
        ) VALUES (
            p_user_id,
            1,
            1,
            'free_grant',
            'Welcome initial free sample room audit grant'
        );
    END IF;
    
    RETURN v_record;
END;
$$;

-- Atomically deduct 1 credit or consume free sample for an audit
CREATE OR REPLACE FUNCTION public.deduct_space_planner_credit(
    p_user_id uuid,
    p_audit_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_credit public.space_planner_credits;
    v_is_sample boolean := false;
    v_new_balance integer;
BEGIN
    PERFORM public.get_or_create_space_planner_credits(p_user_id);
    
    SELECT * INTO v_credit 
    FROM public.space_planner_credits 
    WHERE user_id = p_user_id 
    FOR UPDATE;

    IF v_credit.balance <= 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient credits. Please purchase a room credit or package to generate this audit.',
            'balance', v_credit.balance
        );
    END IF;

    IF NOT v_credit.free_sample_used THEN
        v_is_sample := true;
    END IF;

    v_new_balance := v_credit.balance - 1;

    UPDATE public.space_planner_credits
    SET balance = v_new_balance,
        free_sample_used = true,
        lifetime_used = v_credit.lifetime_used + 1,
        updated_at = timezone('utc'::text, now())
    WHERE user_id = p_user_id;

    INSERT INTO public.space_planner_transactions (
        user_id,
        amount,
        balance_after,
        transaction_type,
        description,
        audit_id
    ) VALUES (
        p_user_id,
        -1,
        v_new_balance,
        'audit_deduction',
        CASE WHEN v_is_sample THEN 'Redeemed Free Sample Room Audit' ELSE 'Room Audit Execution' END,
        p_audit_id
    );

    IF p_audit_id IS NOT NULL THEN
        UPDATE public.space_audits
        SET is_free_sample = v_is_sample,
            updated_at = timezone('utc'::text, now())
        WHERE id = p_audit_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'balance', v_new_balance,
        'used_free_sample', v_is_sample
    );
END;
$$;

-- Add credits (Stripe webhook or admin grant)
CREATE OR REPLACE FUNCTION public.add_space_planner_credits(
    p_user_id uuid,
    p_amount integer,
    p_stripe_session_id text DEFAULT NULL,
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_credit public.space_planner_credits;
    v_new_balance integer;
BEGIN
    IF p_amount <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Credit amount must be positive');
    END IF;

    PERFORM public.get_or_create_space_planner_credits(p_user_id);

    SELECT * INTO v_credit
    FROM public.space_planner_credits
    WHERE user_id = p_user_id
    FOR UPDATE;

    v_new_balance := v_credit.balance + p_amount;

    UPDATE public.space_planner_credits
    SET balance = v_new_balance,
        lifetime_granted = v_credit.lifetime_granted + p_amount,
        updated_at = timezone('utc'::text, now())
    WHERE user_id = p_user_id;

    INSERT INTO public.space_planner_transactions (
        user_id,
        amount,
        balance_after,
        transaction_type,
        description,
        stripe_session_id,
        metadata
    ) VALUES (
        p_user_id,
        p_amount,
        v_new_balance,
        'purchase',
        format('Purchased %s room audit credit(s)', p_amount),
        p_stripe_session_id,
        p_metadata
    );

    RETURN jsonb_build_object(
        'success', true,
        'new_balance', v_new_balance
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- 6. PERMISSIONS & ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------------------------

-- Grants
GRANT ALL ON TABLE public.space_planner_credits TO authenticated, service_role;
GRANT ALL ON TABLE public.space_planner_transactions TO authenticated, service_role;
GRANT ALL ON TABLE public.space_audits TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.space_audit_results TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.space_planner_guest_usage TO anon, authenticated, service_role;

-- Enable RLS
ALTER TABLE public.space_planner_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_planner_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_audit_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_planner_guest_usage ENABLE ROW LEVEL SECURITY;

-- Policies for space_planner_credits
DROP POLICY IF EXISTS "Users can view own credits" ON public.space_planner_credits;
CREATE POLICY "Users can view own credits"
    ON public.space_planner_credits FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Policies for space_planner_transactions
DROP POLICY IF EXISTS "Users can view own credit ledger" ON public.space_planner_transactions;
CREATE POLICY "Users can view own credit ledger"
    ON public.space_planner_transactions FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Policies for space_audits
DROP POLICY IF EXISTS "Users can view own audits" ON public.space_audits;
CREATE POLICY "Users can view own audits"
    ON public.space_audits FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own audits" ON public.space_audits;
CREATE POLICY "Users can insert own audits"
    ON public.space_audits FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own audits" ON public.space_audits;
CREATE POLICY "Users can update own audits"
    ON public.space_audits FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow anon to read guest audits" ON public.space_audits;
CREATE POLICY "Allow anon to read guest audits"
    ON public.space_audits FOR SELECT
    TO anon
    USING (user_id IS NULL);

DROP POLICY IF EXISTS "Allow anon to insert guest audits" ON public.space_audits;
CREATE POLICY "Allow anon to insert guest audits"
    ON public.space_audits FOR INSERT
    TO anon
    WITH CHECK (user_id IS NULL);

-- Policies for space_audit_results
DROP POLICY IF EXISTS "Users can view own audit results" ON public.space_audit_results;
CREATE POLICY "Users can view own audit results"
    ON public.space_audit_results FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow anon to read guest audit results" ON public.space_audit_results;
CREATE POLICY "Allow anon to read guest audit results"
    ON public.space_audit_results FOR SELECT
    TO anon
    USING (user_id IS NULL);

DROP POLICY IF EXISTS "Allow anon to insert guest audit results" ON public.space_audit_results;
CREATE POLICY "Allow anon to insert guest audit results"
    ON public.space_audit_results FOR INSERT
    TO anon
    WITH CHECK (user_id IS NULL);

DROP POLICY IF EXISTS "Service role can manage audit results" ON public.space_audit_results;
CREATE POLICY "Service role can manage audit results"
    ON public.space_audit_results FOR ALL
    TO service_role
    USING (true);

-- Policies for guest usage
DROP POLICY IF EXISTS "Allow anon read guest usage" ON public.space_planner_guest_usage;
CREATE POLICY "Allow anon read guest usage"
    ON public.space_planner_guest_usage FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow anon insert guest usage" ON public.space_planner_guest_usage;
CREATE POLICY "Allow anon insert guest usage"
    ON public.space_planner_guest_usage FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 7. SUPABASE STORAGE BUCKET CONFIGURATION & POLICIES
-- ------------------------------------------------------------------------------

-- Create the dedicated bucket for space planner media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'space-planner-media',
    'space-planner-media',
    true,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/avif']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/avif'];

-- Storage upload policy for anonymous and authenticated users
DROP POLICY IF EXISTS "Allow all uploads to space-planner-media" ON storage.objects;
CREATE POLICY "Allow all uploads to space-planner-media"
    ON storage.objects FOR INSERT
    TO anon, authenticated, service_role
    WITH CHECK (bucket_id = 'space-planner-media');

-- Storage public read policy
DROP POLICY IF EXISTS "Allow public read of space-planner-media" ON storage.objects;
CREATE POLICY "Allow public read of space-planner-media"
    ON storage.objects FOR SELECT
    TO public, anon, authenticated
    USING (bucket_id = 'space-planner-media');

-- Storage service role manage policy
DROP POLICY IF EXISTS "Service role manages space-planner-media" ON storage.objects;
CREATE POLICY "Service role manages space-planner-media"
    ON storage.objects FOR ALL
    TO service_role
    USING (bucket_id = 'space-planner-media');
