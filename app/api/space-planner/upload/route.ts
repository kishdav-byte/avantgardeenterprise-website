import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createAdminSupabase } from '@/lib/supabaseServer'
import { getOrDeriveFingerprint, checkGuestMicroAuditLimit } from '@/lib/space-planner-fingerprint'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
const MAX_FILE_SIZE_BYTES = 12 * 1024 * 1024 // 12 MB

export async function POST(req: NextRequest) {
    try {
        const supabase = await createServerSupabase()
        const adminSupabase = createAdminSupabase()

        // 1. Identify User or Guest
        const { data: { user } } = await supabase.auth.getUser()

        let userOrGuestId: string

        if (user) {
            userOrGuestId = user.id
        } else {
            // For unauthenticated guests, verify they haven't already consumed their 1 free micro-audit
            const { fingerprint, ipHash } = getOrDeriveFingerprint(req)
            const sampleUsedCookie = req.cookies.get('sp_sample_used')?.value === 'true'
            const { used } = await checkGuestMicroAuditLimit(fingerprint, ipHash)

            if (used || sampleUsedCookie) {
                return NextResponse.json(
                    {
                        error: 'You have already used your 1 complimentary micro-audit sample. Please sign in to run additional room audits.',
                        code: 'GUEST_LIMIT_REACHED',
                    },
                    { status: 402 }
                )
            }

            userOrGuestId = `anon_${fingerprint.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20)}`
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
        const storagePath = `${userOrGuestId}/${Date.now()}-${randomUUID()}.${sanitizedExt}`

        // 5. Convert File to ArrayBuffer/Buffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // 6. Upload to Supabase Storage bucket 'space-planner-media' using privileged client
        let uploadData: any = null
        let uploadError: any = null

        const uploadRes = await adminSupabase.storage
            .from('space-planner-media')
            .upload(storagePath, buffer, {
                contentType: file.type,
                upsert: true,
            })

        uploadData = uploadRes.data
        uploadError = uploadRes.error

        // If bucket is missing, attempt to create it on the fly
        if (uploadError && (uploadError.message?.includes('Bucket not found') || uploadError.message?.toLowerCase().includes('not found'))) {
            console.warn('[SpaceIQ Upload] Bucket space-planner-media not found. Attempting automatic creation...')
            try {
                const { error: createErr } = await adminSupabase.storage.createBucket('space-planner-media', {
                    public: true,
                    fileSizeLimit: MAX_FILE_SIZE_BYTES,
                })
                if (!createErr) {
                    console.log('[SpaceIQ Upload] Bucket space-planner-media created. Retrying upload...')
                    const retryRes = await adminSupabase.storage
                        .from('space-planner-media')
                        .upload(storagePath, buffer, {
                            contentType: file.type,
                            upsert: true,
                        })
                    uploadData = retryRes.data
                    uploadError = retryRes.error
                }
            } catch (e: any) {
                console.warn('[SpaceIQ Upload] Bucket auto-creation attempt failed:', e?.message)
            }
        }

        // If Supabase Storage is still unavailable, use resilient base64 Data URL fallback
        // so the user's mobile audit NEVER fails!
        if (uploadError || !uploadData) {
            console.warn(
                '[SpaceIQ Upload] Supabase storage upload failed (' +
                (uploadError?.message || 'unknown') +
                '). Falling back to inline base64 image data URL.'
            )
            const mime = file.type || 'image/jpeg'
            const base64Data = buffer.toString('base64')
            const dataUrl = `data:${mime};base64,${base64Data}`

            return NextResponse.json({
                success: true,
                url: dataUrl,
                path: `fallback/${Date.now()}-${randomUUID()}.${sanitizedExt}`,
                filename: file.name,
                size: file.size,
                isFallback: true,
            })
        }

        // 7. Retrieve public URL
        const { data: { publicUrl } } = adminSupabase.storage
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
