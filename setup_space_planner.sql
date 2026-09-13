-- ==============================================================================
-- SPACE PLANNER MICRO-SAAS: DATABASE ARCHITECTURE (PHASE 1)
-- Description: Room & Space Organization Planner with Home/Classroom Toggle,
--              Credit-based monetization (Free Sample + Pay-Per-Room),
--              and multimodal AI audit storage.
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. USER CREDIT BALANCE & TRANSACTION LEDGER
-- ------------------------------------------------------------------------------

-- Credit balance tracker per user (Free Sample + Purchased Credits)
CREATE TABLE IF NOT EXISTS public.space_planner_credits (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    balance integer NOT NULL DEFAULT 1 CHECK (balance >= 0), -- Starts with 1 free sample audit
    free_sample_used boolean NOT NULL DEFAULT false,
    lifetime_granted integer NOT NULL DEFAULT 1 CHECK (lifetime_granted >= 0),
    lifetime_used integer NOT NULL DEFAULT 0 CHECK (lifetime_used >= 0),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Immutable transaction ledger for credit purchases, free grants, and audit deductions
CREATE TABLE IF NOT EXISTS public.space_planner_transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount integer NOT NULL, -- e.g., +1 for free grant, +5 for bundle purchase, -1 for room audit
    balance_after integer NOT NULL CHECK (balance_after >= 0),
    transaction_type text NOT NULL CHECK (transaction_type IN ('free_grant', 'purchase', 'audit_deduction', 'refund', 'admin_adjustment')),
    description text NOT NULL,
    audit_id uuid, -- Associated audit if deduction
    stripe_session_id text, -- Associated checkout session if purchase
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 2. AUDITS TABLE (INPUTS & METADATA)
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.space_audits (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Context & Room Specification
    space_context text NOT NULL CHECK (space_context IN ('home', 'classroom', 'business')),
    room_type text NOT NULL, -- e.g., 'living_room', 'kindergarten', 'retail_sales_floor'
    title text, -- Optional custom room title e.g. "Mrs. Higgins' 2nd Grade Classroom", "Downtown Boutique Stockroom"
    
    -- Goals & Budget
    goals text[] NOT NULL DEFAULT '{}', -- e.g. ['organize_categorize', 'minimize_declutter', 'compliance_safety_readiness']
    budget_tier text NOT NULL DEFAULT 'medium' CHECK (budget_tier IN ('diy_low', 'medium', 'high', 'open')),
    budget_limit numeric(10, 2), -- Optional specific monetary ceiling
    
    -- Lifestyle & Environment Metrics (Differentiated by Context)
    -- Home: { family_size: 4, has_pets: true, primary_usage: "storage", age_groups: ["toddler", "adult"] }
    -- Classroom: { student_count: 24, grade_level: "3rd Grade", subject_focus: "Science", accessibility_needs: true }
    -- Business: { employee_headcount: 12, daily_foot_traffic: "high_retail_volume", compliance_requirements: ["osha_general"], storage_turnover_frequency: "weekly_restock" }
    lifestyle_metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
    
    -- Image References (clutter photos stored in Supabase Storage)
    clutter_photos text[] NOT NULL DEFAULT '{}',
    
    -- State & Credit Tracking
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'queued', 'processing', 'completed', 'failed')),
    is_free_sample boolean NOT NULL DEFAULT false,
    error_message text,
    
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 3. AUDIT RESULTS TABLE (STRUCTURED AI OUTPUT)
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.space_audit_results (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    audit_id uuid REFERENCES public.space_audits(id) ON DELETE CASCADE NOT NULL UNIQUE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- High-level Assessment
    executive_summary text NOT NULL,
    key_pain_points text[] NOT NULL DEFAULT '{}',
    
    -- Output 1: Phased Action Plan
    -- Array of objects: [{ phase_number: 1, title: "Purge & Categorize", steps: [...], time_minutes: 60 }]
    phased_steps jsonb NOT NULL DEFAULT '[]'::jsonb,
    
    -- Output 2: Visual Concept Mockup
    visual_mockup_url text, -- Storage/CDN URL of generated photorealistic "after" concept
    visual_mockup_prompt text, -- AI prompt used to synthesize the mockup
    
    -- Output 3: Itemized Amazon Affiliate Shopping List
    -- Array of objects: [{ title: string, category: string, asin: string, affiliate_url: string, price_estimate: number, priority: 'must_have' | 'recommended' | 'optional', placement_zone: string }]
    product_recommendations jsonb NOT NULL DEFAULT '[]'::jsonb,
    
    -- Efficiency & Diagnostic Metrics
    -- { estimated_space_reclaimed_pct: 35, clutter_reduction_score: 85, maintenance_difficulty: "low" }
    space_metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
    
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Foreign key linking transaction to audit
ALTER TABLE public.space_planner_transactions
    DROP CONSTRAINT IF EXISTS fk_space_planner_transactions_audit;
ALTER TABLE public.space_planner_transactions
    ADD CONSTRAINT fk_space_planner_transactions_audit
    FOREIGN KEY (audit_id) REFERENCES public.space_audits(id) ON DELETE SET NULL;

-- ------------------------------------------------------------------------------
-- 4. ATOMIC DATABASE FUNCTIONS (TRANSACTIONS & SAFE CREDIT DEDUCTION)
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

        -- Record initial grant transaction
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
    -- Ensure record exists with row lock for atomic transaction
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

    -- Determine if this is consuming the free sample
    IF NOT v_credit.free_sample_used THEN
        v_is_sample := true;
    END IF;

    v_new_balance := v_credit.balance - 1;

    -- Update credits
    UPDATE public.space_planner_credits
    SET balance = v_new_balance,
        free_sample_used = true,
        lifetime_used = v_credit.lifetime_used + 1,
        updated_at = timezone('utc'::text, now())
    WHERE user_id = p_user_id;

    -- Record transaction
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

    -- Mark audit with free sample flag
    UPDATE public.space_audits
    SET is_free_sample = v_is_sample,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_audit_id;

    RETURN jsonb_build_object(
        'success', true,
        'balance', v_new_balance,
        'is_free_sample', v_is_sample
    );
END;
$$;

-- Add credits (Stripe webhook or admin grant)
CREATE OR REPLACE FUNCTION public.add_space_planner_credits(
    p_user_id uuid,
    p_amount integer,
    p_type text,
    p_description text,
    p_stripe_session_id text DEFAULT NULL
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
        stripe_session_id
    ) VALUES (
        p_user_id,
        p_amount,
        v_new_balance,
        p_type,
        p_description,
        p_stripe_session_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'balance', v_new_balance
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

ALTER TABLE public.space_planner_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_planner_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_audit_results ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT ALL ON TABLE public.space_planner_credits TO authenticated;
GRANT ALL ON TABLE public.space_planner_transactions TO authenticated;
GRANT ALL ON TABLE public.space_audits TO authenticated;
GRANT ALL ON TABLE public.space_audit_results TO authenticated;

GRANT ALL ON TABLE public.space_planner_credits TO service_role;
GRANT ALL ON TABLE public.space_planner_transactions TO service_role;
GRANT ALL ON TABLE public.space_audits TO service_role;
GRANT ALL ON TABLE public.space_audit_results TO service_role;

-- Policies for space_planner_credits
DROP POLICY IF EXISTS "Users can view own credits" ON public.space_planner_credits;
CREATE POLICY "Users can view own credits"
    ON public.space_planner_credits FOR SELECT
    USING (auth.uid() = user_id);

-- Policies for space_planner_transactions
DROP POLICY IF EXISTS "Users can view own credit ledger" ON public.space_planner_transactions;
CREATE POLICY "Users can view own credit ledger"
    ON public.space_planner_transactions FOR SELECT
    USING (auth.uid() = user_id);

-- Policies for space_audits
DROP POLICY IF EXISTS "Users can view own audits" ON public.space_audits;
CREATE POLICY "Users can view own audits"
    ON public.space_audits FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own audits" ON public.space_audits;
CREATE POLICY "Users can insert own audits"
    ON public.space_audits FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own audits" ON public.space_audits;
CREATE POLICY "Users can update own audits"
    ON public.space_audits FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own audits" ON public.space_audits;
CREATE POLICY "Users can delete own audits"
    ON public.space_audits FOR DELETE
    USING (auth.uid() = user_id);

-- Policies for space_audit_results
DROP POLICY IF EXISTS "Users can view own audit results" ON public.space_audit_results;
CREATE POLICY "Users can view own audit results"
    ON public.space_audit_results FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can insert audit results" ON public.space_audit_results;
CREATE POLICY "Service role can insert audit results"
    ON public.space_audit_results FOR INSERT
    WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can update audit results" ON public.space_audit_results;
CREATE POLICY "Service role can update audit results"
    ON public.space_audit_results FOR UPDATE
    USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- ------------------------------------------------------------------------------
-- 6. SUPABASE STORAGE BUCKET CONFIGURATION & POLICIES
-- ------------------------------------------------------------------------------

-- Create the dedicated bucket for space planner media (clutter uploads & generated mockups)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'space-planner-media',
    'space-planner-media',
    true,
    10485760, -- 10MB maximum file size per image
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/avif']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/avif'];

-- Allow authenticated users to upload photos to their own user folder:
-- Structure: space-planner-media/clutter/{userId}/{auditId}/{filename}
DROP POLICY IF EXISTS "Allow authenticated clutter uploads" ON storage.objects;
CREATE POLICY "Allow authenticated clutter uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'space-planner-media' AND
    (storage.foldername(name))[1] = 'clutter' AND
    auth.uid()::text = (storage.foldername(name))[2]
);

-- Allow authenticated users to view their own uploaded clutter photos
DROP POLICY IF EXISTS "Allow users to view own clutter photos" ON storage.objects;
CREATE POLICY "Allow users to view own clutter photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'space-planner-media' AND
    (storage.foldername(name))[1] = 'clutter' AND
    auth.uid()::text = (storage.foldername(name))[2]
);

-- Allow public viewing for generated mockup renders
-- Structure: space-planner-media/mockups/...
DROP POLICY IF EXISTS "Allow public viewing of mockups" ON storage.objects;
CREATE POLICY "Allow public viewing of mockups"
ON storage.objects FOR SELECT
TO public
USING (
    bucket_id = 'space-planner-media' AND
    (storage.foldername(name))[1] = 'mockups'
);

-- Allow service role full control over space-planner-media
DROP POLICY IF EXISTS "Service role manages space-planner-media" ON storage.objects;
CREATE POLICY "Service role manages space-planner-media"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'space-planner-media');
