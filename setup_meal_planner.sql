-- Meal Planner Tool Database Setup
-- This creates the necessary tables for usage tracking, subscription management, and favorites

-- 1. Create meal_planner_usage table to track API calls and enforce limits
CREATE TABLE IF NOT EXISTS public.meal_planner_usage (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  action_type text NOT NULL, -- 'meal_plan', 'single_recipe', 'meal_recipe'
  request_data jsonb, -- Store the request for debugging/analytics
  response_data jsonb, -- Store response for caching potential
  success boolean DEFAULT true
);

-- 2. Create meal_planner_favorites table for saved recipes
CREATE TABLE IF NOT EXISTS public.meal_planner_favorites (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  recipe_name text NOT NULL,
  ingredients jsonb NOT NULL,
  instructions jsonb NOT NULL,
  UNIQUE(user_id, recipe_name)
);

-- 3. Create meal_planner_subscriptions table (for future paid tier)
CREATE TABLE IF NOT EXISTS public.meal_planner_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  subscription_status text DEFAULT 'beta_free', -- 'beta_free', 'active', 'cancelled', 'expired'
  subscription_tier text DEFAULT 'free', -- 'free', 'premium'
  monthly_limit integer DEFAULT 50, -- Number of requests per month (null = unlimited for admin)
  expires_at timestamp with time zone,
  UNIQUE(user_id)
);

-- 4. Enable RLS on all tables
ALTER TABLE public.meal_planner_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_planner_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_planner_subscriptions ENABLE ROW LEVEL SECURITY;

-- 5. Grant permissions
GRANT ALL ON TABLE public.meal_planner_usage TO authenticated;
GRANT ALL ON TABLE public.meal_planner_favorites TO authenticated;
GRANT ALL ON TABLE public.meal_planner_subscriptions TO authenticated;
GRANT ALL ON TABLE public.meal_planner_usage TO service_role;
GRANT ALL ON TABLE public.meal_planner_favorites TO service_role;
GRANT ALL ON TABLE public.meal_planner_subscriptions TO service_role;

-- 6. Create RLS Policies for meal_planner_usage
DROP POLICY IF EXISTS "Users can view own usage" ON public.meal_planner_usage;
CREATE POLICY "Users can view own usage"
  ON public.meal_planner_usage FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own usage" ON public.meal_planner_usage;
CREATE POLICY "Users can insert own usage"
  ON public.meal_planner_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 7. Create RLS Policies for meal_planner_favorites
DROP POLICY IF EXISTS "Users can manage own favorites" ON public.meal_planner_favorites;
CREATE POLICY "Users can manage own favorites"
  ON public.meal_planner_favorites FOR ALL
  USING (auth.uid() = user_id);

-- 8. Create RLS Policies for meal_planner_subscriptions
DROP POLICY IF EXISTS "Users can view own subscription" ON public.meal_planner_subscriptions;
CREATE POLICY "Users can view own subscription"
  ON public.meal_planner_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own subscription" ON public.meal_planner_subscriptions;
CREATE POLICY "Users can insert own subscription"
  ON public.meal_planner_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 9. Create function to check if user has remaining quota
CREATE OR REPLACE FUNCTION public.check_meal_planner_quota(user_uuid uuid)
RETURNS boolean AS $$
DECLARE
  user_role text;
  monthly_limit integer;
  usage_count integer;
  subscription_status text;
BEGIN
  -- Check if user is admin (unlimited access)
  SELECT role INTO user_role FROM public.clients WHERE id = user_uuid;
  IF user_role = 'admin' THEN
    RETURN true;
  END IF;

  -- Get subscription info
  SELECT 
    s.monthly_limit,
    s.subscription_status
  INTO monthly_limit, subscription_status
  FROM public.meal_planner_subscriptions s
  WHERE s.user_id = user_uuid;

  -- If no subscription exists, create beta_free subscription
  IF NOT FOUND THEN
    INSERT INTO public.meal_planner_subscriptions (user_id, subscription_status, subscription_tier, monthly_limit)
    VALUES (user_uuid, 'beta_free', 'free', 50);
    monthly_limit := 50;
    subscription_status := 'beta_free';
  END IF;

  -- Check if subscription is active
  IF subscription_status NOT IN ('beta_free', 'active') THEN
    RETURN false;
  END IF;

  -- Count usage in current month
  SELECT COUNT(*) INTO usage_count
  FROM public.meal_planner_usage
  WHERE user_id = user_uuid
    AND created_at >= date_trunc('month', CURRENT_TIMESTAMP)
    AND success = true;

  -- Check if under limit
  RETURN usage_count < monthly_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create function to get usage stats
CREATE OR REPLACE FUNCTION public.get_meal_planner_stats(user_uuid uuid)
RETURNS TABLE(
  total_requests bigint,
  monthly_requests bigint,
  monthly_limit integer,
  subscription_status text,
  is_admin boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.meal_planner_usage WHERE user_id = user_uuid AND success = true) as total_requests,
    (SELECT COUNT(*) FROM public.meal_planner_usage 
     WHERE user_id = user_uuid 
       AND created_at >= date_trunc('month', CURRENT_TIMESTAMP)
       AND success = true) as monthly_requests,
    COALESCE(s.monthly_limit, 50) as monthly_limit,
    COALESCE(s.subscription_status, 'beta_free') as subscription_status,
    (SELECT role = 'admin' FROM public.clients WHERE id = user_uuid) as is_admin
  FROM public.meal_planner_subscriptions s
  WHERE s.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Verify setup
SELECT 'Meal Planner database setup complete!' as status;
