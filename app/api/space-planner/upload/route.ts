import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabaseServer'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
const MAX_FILE_SIZE_BYTES = 12 * 1024 * 1024 // 12 MB

export async function POST(req: NextRequest) {
    try {
        const supabase = await createServerSupabase()

        // 1. Authenticate user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
        }

        // 2. Parse form data
        const formData = await req.formData()
        const file = formData.get('file') as File | null

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        // 3. Validate file size and type
        if (file.size > MAX_FILE_SIZE_BYTES) {
            return NextResponse.json(
                { error: 'File exceeds 12MB size limit. Please compress or select a smaller image.' },
                { status: 400 }
            )
        }

        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: `Unsupported file type: ${file.type}. Allowed formats: JPG, PNG, WEBP.` },
                { status: 400 }
            )
        }

        // 4. Determine file extension and storage path
        const ext = file.name.split('.').pop() || 'jpg'
        const sanitizedExt = ext.toLowerCase().replace(/[^a-z0-9]/g, '')
        const storagePath = `${user.id}/${Date.now()}-${randomUUID()}.${sanitizedExt}`

        // 5. Convert File to ArrayBuffer/Buffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // 6. Upload to Supabase Storage bucket 'space-planner-media'
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('space-planner-media')
            .upload(storagePath, buffer, {
                contentType: file.type,
                upsert: true,
            })

        if (uploadError) {
            console.error('Supabase storage upload error:', uploadError)
            return NextResponse.json(
                { error: `Storage upload failed: ${uploadError.message}` },
                { status: 500 }
            )
        }

        // 7. Retrieve public URL
        const { data: { publicUrl } } = supabase.storage
            .from('space-planner-media')
            .getPublicUrl(uploadData.path)

        return NextResponse.json({
            success: true,
            url: publicUrl,
            path: uploadData.path,
            filename: file.name,
            size: file.size,
        })
    } catch (err: any) {
        console.error('Unexpected error in photo upload route:', err)
        return NextResponse.json(
            { error: err?.message || 'An unexpected error occurred during photo upload' },
            { status: 500 }
        )
    }
}
