import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { dogId, weekNumber, dayNumber, drillName, score, notes } = body;

        if (!dogId || !weekNumber || !dayNumber || !drillName || !score) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data, error } = await supabase.from('k9_training_logs').upsert({
            dog_id: dogId,
            week_number: weekNumber,
            day_number: dayNumber,
            drill_name: drillName,
            score: score,
            notes: notes || null
        }, {
            onConflict: 'dog_id,week_number,day_number,drill_name'
        }).select();

        if (error) {
            console.error('Supabase error inserting log:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, log: data ? data[0] : null });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
