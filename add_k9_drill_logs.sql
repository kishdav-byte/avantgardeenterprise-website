-- Create the k9_training_logs table to track daily drill progress
CREATE TABLE IF NOT EXISTS public.k9_training_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dog_id UUID NOT NULL REFERENCES public.k9_dogs(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL,
    day_number INTEGER NOT NULL,
    drill_name TEXT NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5), -- 1: Struggled, 3: Good, 5: Perfect
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure a user can only log a drill once per day per week
    UNIQUE(dog_id, week_number, day_number, drill_name)
);

-- Note: RLS policies
ALTER TABLE public.k9_training_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own dog's logs"
    ON public.k9_training_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.k9_dogs
            WHERE k9_dogs.id = k9_training_logs.dog_id
            AND k9_dogs.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert logs for their own dogs"
    ON public.k9_training_logs FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.k9_dogs
            WHERE k9_dogs.id = k9_training_logs.dog_id
            AND k9_dogs.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update logs for their own dogs"
    ON public.k9_training_logs FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.k9_dogs
            WHERE k9_dogs.id = k9_training_logs.dog_id
            AND k9_dogs.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete logs for their own dogs"
    ON public.k9_training_logs FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.k9_dogs
            WHERE k9_dogs.id = k9_training_logs.dog_id
            AND k9_dogs.user_id = auth.uid()
        )
    );
