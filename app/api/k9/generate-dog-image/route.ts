import { NextResponse } from 'next/server';
import { createServerClient } from "@supabase/ssr";
import OpenAI from "openai";
import { cookies } from "next/headers";

const apiKey = process.env.OPENAI_API_KEY || '';
const openai = new OpenAI({ apiKey });

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll(); },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
                        } catch { }
                    }
                },
            }
        );

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { dogId } = await req.json();
        if (!dogId) return NextResponse.json({ error: "Missing dog ID" }, { status: 400 });

        // Get the dog profile
        const { data: dogData, error: dogError } = await supabase.from('k9_dogs').select('*').eq('id', dogId).single();
        if (dogError || !dogData) return NextResponse.json({ error: "Dog not found" }, { status: 404 });

        const breed = dogData.breed;
        const color = dogData.color;
        const ageDesc = dogData.age_months < 12 ? 'puppy' : 'adult dog';

        // Generate the image using DALL-E 3
        const prompt = `A highly professional, photorealistic portrait of a ${color || ''} ${breed} ${ageDesc}. The dog is looking directly at the camera with a happy, alert expression. The background should be a clean, modern, soft-focus studio backdrop (like soft pastel or slate grey) to make the dog pop. Studio lighting, high resolution, award-winning pet photography.`;

        const imageResponse = await openai.images.generate({
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: "1024x1024",
            response_format: "b64_json"
        });

        if (!imageResponse.data || !imageResponse.data[0].b64_json) {
            throw new Error("Failed to generate image data");
        }
        const b64Json = imageResponse.data[0].b64_json;

        // Convert base64 to buffer
        const buffer = Buffer.from(b64Json, 'base64');
        const fileName = `${user.id}/${dogId}-${Date.now()}.png`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('k9-images')
            .upload(fileName, buffer, {
                contentType: 'image/png',
                upsert: true
            });

        if (uploadError) {
            console.error("Storage upload error:", uploadError);
            throw new Error("Failed to upload image to storage. Make sure you ran the SQL script to create the bucket.");
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage.from('k9-images').getPublicUrl(fileName);
        const imageUrl = publicUrlData.publicUrl;

        // Save to dog profile
        const { error: updateError } = await supabase.from('k9_dogs')
            .update({ profile_image_url: imageUrl })
            .eq('id', dogId);

        if (updateError) {
            console.error("Update DB error:", updateError);
            throw new Error("Failed to save image URL to database. Make sure you ran the SQL script to add the profile_image_url column.");
        }

        return NextResponse.json({ imageUrl });

    } catch (error: any) {
        console.error("Generate Image Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
