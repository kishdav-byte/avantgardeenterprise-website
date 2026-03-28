import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const apiKey = process.env.OPENAI_API_KEY || '';
const openai = new OpenAI({ apiKey });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// We use the service key for bypassing auth during this isolated test, or fallback to anon
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("1. Testing DB Access to tai_chi_visuals...");
    const { data: dbData, error: dbError } = await supabase.from('tai_chi_visuals').select('*').limit(1);
    if (dbError) {
        console.error("❌ DB Query Error (Make sure the table exists):", dbError.message);
        return;
    }
    console.log("✅ DB Connection OK. Existing Cache Entries:", dbData?.length || 0);

    console.log("\n2. Testing OpenAI Sora API...");
    const prompt = 'A highly professional, photorealistic educational video of a person performing the Tai Chi movement "Simple Arm Circle". Clean, soft-focus studio backdrop. Award-winning videography.';

    try {
        const videoJob = await openai.videos.create({
            model: "sora-2",
            prompt: prompt,
            seconds: "4",
            size: "720x1280"
        });

        console.log(`✅ Job created successfully! ID: ${videoJob.id}`);
        console.log(`⏳ Polling for completion (this takes 30-90 seconds usually)...`);

        let isComplete = false;
        let currentJob = null;
        let polls = 0;

        while (!isComplete && polls < 40) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            currentJob = await openai.videos.retrieve(videoJob.id);
            process.stdout.write(`.`); // Loading indicator

            if (currentJob.status === 'completed' || currentJob.status === 'failed') {
                isComplete = true;
                console.log(`\n✅ Status: ${currentJob.status.toUpperCase()}`);
            }
            polls++;
        }

        if (currentJob?.status === 'completed') {
            console.log("\n3. Downloading video buffer from OpenAI...");
            const response = await openai.videos.downloadContent(videoJob.id);
            if (!response.ok) {
                console.error("❌ Download failed:", response.status);
                return;
            }
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            console.log(`✅ Download exacted. Size: ${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB`);

            console.log("\n4. Uploading to Supabase bucket 'tai_chi_videos'...");
            const fileName = `test-arm-circle-${Date.now()}.mp4`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('tai_chi_videos')
                .upload(fileName, buffer, {
                    contentType: 'video/mp4'
                });

            if (uploadError) {
                console.error("❌ Storage Upload Error (Ensure bucket exists and policies allow it!):", uploadError.message);
            } else {
                console.log("✅ Video Uploaded Successfully to Bucket:", uploadData?.path);
                const { data: publicUrlData } = supabase.storage.from('tai_chi_videos').getPublicUrl(fileName);
                console.log("🔗 Public URL:", publicUrlData.publicUrl);

                console.log("\n5. Testing DB Cache Insert...");
                const { error: insertError } = await supabase.from('tai_chi_visuals').insert([{
                    exercise_name: 'test-arm-circle',
                    video_url: publicUrlData.publicUrl
                }]);

                if (insertError) {
                    console.error("❌ DB Insert Error:", insertError.message);
                } else {
                    console.log("✅ DB Insert OK! The cache mapping table works perfectly.");
                    console.log("🚀 SORA UPGRADE IS FULLY OPERATIONAL AND TESTED!");
                }
            }
        } else {
            console.error("\n❌ Job failed or timed out:", currentJob);
        }
    } catch (e: any) {
        console.error("\n❌ API Error:", e.name, e.message);
    }
}

run();
