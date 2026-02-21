import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    try {
        const key = process.env.GEMINI_API_KEY || process.env.Gemini_API_Key || '';
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await res.json();
        return NextResponse.json({ models: data.models?.map((m: any) => m.name) || [], error: data.error });
    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
