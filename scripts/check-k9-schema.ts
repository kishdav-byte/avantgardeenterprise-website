import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function main() {
    const { data: user } = await supabase.auth.signUp({
        email: 'test_image@example.com',
        password: 'password123'
    });
    console.log(user);
    const { error } = await supabase.from('k9_dogs').insert({
        user_id: user.user?.id,
        name: 'Test',
        breed: 'Test',
        color: 'Test',
        age_months: 1,
        energy_level: 'Low',
        training_minutes_per_day: 10,
        training_days_per_week: 1,
        profile_image_url: 'http://example.com/test.jpg'
    });
    console.log("INSERT ERROR:", error);
}
main();
