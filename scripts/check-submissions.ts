import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function main() {
    const { data: submissions, error: subError } = await supabase
        .from('k9_video_submissions')
        .select(`
            id,
            status,
            created_at,
            k9_ai_feedback_logs (
                id,
                raw_json_response
            )
        `)
        .order('created_at', { ascending: false });

    console.log("Submissions:");
    if (submissions) {
        submissions.forEach(sub => {
            console.log(`ID: ${sub.id}, Status: ${sub.status}, Created: ${sub.created_at}, Logs: ${sub.k9_ai_feedback_logs?.length}`);
            if (sub.k9_ai_feedback_logs && sub.k9_ai_feedback_logs.length > 0) {
                console.log(`Plan format keys:`, Object.keys(sub.k9_ai_feedback_logs[0].raw_json_response || {}));
            }
        });
    } else {
        console.log("Error fetching submissions:", subError);
    }
}
main();
