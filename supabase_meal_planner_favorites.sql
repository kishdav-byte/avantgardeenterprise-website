-- Create Favorites Table for Meal Planner
CREATE TABLE IF NOT EXISTS public.meal_planner_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipe_name TEXT NOT NULL,
    ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
    instructions JSONB NOT NULL DEFAULT '[]'::jsonb,
    nutrition_info JSONB DEFAULT '{}'::jsonb,
    prep_time TEXT,
    cook_time TEXT,
    servings INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.meal_planner_favorites ENABLE ROW LEVEL SECURITY;

-- Delete existing policies to prevent conflicts
DROP POLICY IF EXISTS "Users can view their own favorites" ON public.meal_planner_favorites;
DROP POLICY IF EXISTS "Users can insert their own favorites" ON public.meal_planner_favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON public.meal_planner_favorites;

-- Create Policies
CREATE POLICY "Users can view their own favorites" 
ON public.meal_planner_favorites FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites" 
ON public.meal_planner_favorites FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" 
ON public.meal_planner_favorites FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_meal_planner_favorites_updated_at
    BEFORE UPDATE ON public.meal_planner_favorites
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
