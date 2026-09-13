import { getClientFingerprint } from './space-planner-fingerprint-client'

/**
 * Client-side photo compression utility before uploading to Supabase Storage.
 * Resizes large smartphone clutter photos to high-performance dimensions (max 1600px)
 * at 82% JPEG quality, dropping 12MB photos down to ~300KB without losing critical organizational details.
 */
export async function compressImageFile(
    file: File,
    maxWidth: number = 1600,
    maxHeight: number = 1600,
    quality: number = 0.82
): Promise<File> {
    if (typeof window === 'undefined') return file

    return new Promise((resolve) => {
        // If file is SVG or non-standard, return as is
        if (!file.type.startsWith('image/') || file.type.includes('svg')) {
            return resolve(file)
        }

        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = (event) => {
            const img = new Image()
            img.src = event.target?.result as string

            img.onload = () => {
                let width = img.width
                let height = img.height

                // Maintain aspect ratio
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width)
                        width = maxWidth
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height)
                        height = maxHeight
                    }
                }

                const canvas = document.createElement('canvas')
                canvas.width = width
                canvas.height = height

                const ctx = canvas.getContext('2d')
                if (!ctx) return resolve(file)

                // High quality image smoothing
                ctx.imageSmoothingEnabled = true
                ctx.imageSmoothingQuality = 'high'
                ctx.drawImage(img, 0, 0, width, height)

                canvas.toBlob(
                    (blob) => {
                        if (!blob) return resolve(file)

                        const compressedFile = new File(
                            [blob],
                            file.name.replace(/\.[^/.]+$/, '') + '.jpg',
                            { type: 'image/jpeg', lastModified: Date.now() }
                        )
                        resolve(compressedFile)
                    },
                    'image/jpeg',
                    quality
                )
            }

            img.onerror = () => resolve(file)
        }

        reader.onerror = () => resolve(file)
    })
}

/**
 * Uploads a single compressed image file to the /api/space-planner/upload endpoint.
 */
export async function uploadSpacePlannerPhoto(file: File): Promise<string> {
    const compressed = await compressImageFile(file)
    const formData = new FormData()
    formData.append('file', compressed)

    const headers: Record<string, string> = {}
    if (typeof window !== 'undefined') {
        const fp = getClientFingerprint()
        if (fp) headers['x-space-planner-fingerprint'] = fp
    }

    const response = await fetch('/api/space-planner/upload', {
        method: 'POST',
        headers,
        body: formData,
    })

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to upload photo')
    }

    const data = await response.json()
    return data.url
}
