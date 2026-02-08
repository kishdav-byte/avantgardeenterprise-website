"use client"

import { useState, useCallback } from 'react'
import { Upload, CheckCircle } from 'lucide-react'

interface ImageFile {
    file: File
    base64: string
}

interface ImageUploaderProps {
    label: string
    onImageUpload: (file: ImageFile | null) => void
}

export function ImageUploader({ label, onImageUpload }: ImageUploaderProps) {
    const [imagePreview, setImagePreview] = useState<string | null>(null)

    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            if (file.size > 4 * 1024 * 1024) { // 4MB limit
                alert("File is too large. Please select an image under 4MB.")
                event.target.value = ''
                return
            }
            const reader = new FileReader()
            reader.onloadend = () => {
                const base64String = (reader.result as string).split(',')[1]
                setImagePreview(reader.result as string)
                onImageUpload({ file, base64: base64String })
            }
            reader.readAsDataURL(file)
        } else {
            setImagePreview(null)
            onImageUpload(null)
        }
    }, [onImageUpload])

    return (
        <div className="bg-white/5 border-2 border-dashed border-white/10 rounded-lg p-6 text-center transition-all duration-300 hover:border-accent hover:bg-white/10 group">
            <label htmlFor={`upload-${label}`} className="cursor-pointer flex flex-col items-center justify-center h-full">
                {imagePreview ? (
                    <>
                        <img src={imagePreview} alt={`${label} preview`} className="max-h-40 w-auto rounded-md mb-4 object-cover" />
                        <div className="flex items-center gap-2 text-accent">
                            <CheckCircle className="w-6 h-6" />
                            <span className="font-bold uppercase tracking-wider text-sm">{label} uploaded!</span>
                        </div>
                        <span className="text-xs text-white/40 mt-1">Click to change</span>
                    </>
                ) : (
                    <>
                        <Upload className="w-12 h-12 text-white/40 group-hover:text-accent transition-colors" />
                        <span className="mt-2 font-bold uppercase tracking-wider text-white/80">Upload {label}</span>
                        <p className="text-sm text-white/40">Click or drag file</p>
                    </>
                )}
            </label>
            <input
                id={`upload-${label}`}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
                onChange={handleFileChange}
            />
        </div>
    )
}
