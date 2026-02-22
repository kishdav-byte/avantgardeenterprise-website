import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
    try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll(); },
                    setAll() { }
                }
            }
        );
        const { data: user } = await supabase.auth.getUser();

        const { data: subs, error: err1 } = await supabase.from('k9_video_submissions').select('*');
        const { data: logs, error: err2 } = await supabase.from('k9_ai_feedback_logs').select('*');

        return NextResponse.json({ subs, logs, err1, err2, user });
    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
