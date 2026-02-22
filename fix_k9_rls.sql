-- Fix: k9_ai_feedback_logs was missing INSERT, UPDATE, DELETE permissions for the authenticated user

DROP POLICY IF EXISTS "Users can view their ai feedback logs" ON public.k9_ai_feedback_logs;
DROP POLICY IF EXISTS "Users can manage their ai feedback logs" ON public.k9_ai_feedback_logs;

CREATE POLICY "Users can manage their ai feedback logs" ON public.k9_ai_feedback_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.k9_video_submissions s WHERE s.id = submission_id AND s.user_id = auth.uid()
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.k9_video_submissions s WHERE s.id = submission_id AND s.user_id = auth.uid()
        )
    );
