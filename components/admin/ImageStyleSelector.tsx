"use client"

import { useState } from 'react'
import { Check } from 'lucide-react'

const IMAGE_STYLES = [
    'Minimalist',
    'Abstract',
    'Realistic',
    'Futuristic',
    'Corporate',
    'Vibrant',
    'Dark',
    'Illustrative'
]

interface ImageStyleSelectorProps {
    selectedStyles: string[]
    onStylesChange: (styles: string[]) => void
    generateMultiple: boolean
    onGenerateMultipleChange: (value: boolean) => void
}

export function ImageStyleSelector({
    selectedStyles,
    onStylesChange,
    generateMultiple,
    onGenerateMultipleChange
}: ImageStyleSelectorProps) {

    const toggleStyle = (style: string) => {
        if (selectedStyles.includes(style)) {
            onStylesChange(selectedStyles.filter(s => s !== style))
        } else {
            onStylesChange([...selectedStyles, style])
        }
    }

    return (
        <div className="space-y-4">
            {/* Toggle for multiple generation */}
            <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl">
                <label className="flex items-center gap-3 cursor-pointer flex-1">
                    <div className="relative">
                        <input
                            type="checkbox"
                            checked={generateMultiple}
                            onChange={(e) => onGenerateMultipleChange(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:bg-accent transition-all"></div>
                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                    </div>
                    <div>
                        <span className="text-sm font-black uppercase tracking-wider block">
                            Generate Multiple Images
                        </span>
                        <span className="text-[10px] text-white/40 uppercase tracking-widest">
                            Create options to choose from
                        </span>
                    </div>
                </label>
            </div>

            {/* Style grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {IMAGE_STYLES.map(style => (
                    <button
                        key={style}
                        type="button"
                        onClick={() => toggleStyle(style)}
                        className={`relative px-4 py-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all group ${selectedStyles.includes(style)
                                ? 'bg-accent text-black shadow-[0_0_20px_rgba(204,255,0,0.3)]'
                                : 'bg-white/5 border border-white/10 hover:border-accent/50 hover:bg-white/10'
                            }`}
                    >
                        {selectedStyles.includes(style) && (
                            <div className="absolute top-2 right-2">
                                <Check size={14} className="text-black" />
                            </div>
                        )}
                        <div className="text-center">
                            {style}
                        </div>
                        {style === 'Realistic' && (
                            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] font-black px-2 py-1 rounded-full">
                                NEW
                            </div>
                        )}
                    </button>
                ))}
            </div>

            {/* Info text */}
            <div className="p-4 bg-black/40 border border-white/5 rounded-xl">
                <p className="text-[10px] text-white/60 italic leading-relaxed">
                    {generateMultiple ? (
                        <>
                            <span className="text-accent font-bold">{selectedStyles.length} image{selectedStyles.length !== 1 ? 's' : ''}</span> will be generated.
                            You'll be able to preview and select your favorite before saving.
                            {selectedStyles.length > 4 && (
                                <span className="text-yellow-400 block mt-1">
                                    ⚠️ Generating {selectedStyles.length} images may take 2-3 minutes
                                </span>
                            )}
                        </>
                    ) : (
                        <>
                            <span className="text-accent font-bold">1 image</span> will be generated using the{' '}
                            <span className="text-white font-bold">{selectedStyles[0] || 'Minimalist'}</span> style and saved automatically.
                        </>
                    )}
                </p>
            </div>
        </div>
    )
}

interface ImageSelectionGridProps {
    images: Array<{ style: string; url: string }>
    selectedUrl: string | null
    onSelect: (url: string) => void
    onSave: () => void
    loading?: boolean
}

export function ImageSelectionGrid({
    images,
    selectedUrl,
    onSelect,
    onSave,
    loading = false
}: ImageSelectionGridProps) {
    return (
        <div className="bg-white/5 border border-white/10 p-8 rounded-[32px] space-y-6">
            <div className="space-y-2">
                <h3 className="text-2xl font-black uppercase tracking-tighter italic text-accent">
                    Select Your Image
                </h3>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">
                    Click on an image to select it
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {images.map((img, idx) => (
                    <div
                        key={idx}
                        onClick={() => onSelect(img.url)}
                        className={`cursor-pointer rounded-xl overflow-hidden border-4 transition-all transform hover:scale-[1.02] ${selectedUrl === img.url
                                ? 'border-accent shadow-[0_0_30px_rgba(204,255,0,0.4)] scale-[1.02]'
                                : 'border-white/10 hover:border-accent/50'
                            }`}
                    >
                        <div className="relative aspect-video">
                            <img
                                src={img.url}
                                alt={`${img.style} style`}
                                className="w-full h-full object-cover"
                            />
                            {selectedUrl === img.url && (
                                <div className="absolute inset-0 bg-accent/20 flex items-center justify-center">
                                    <div className="bg-accent text-black p-3 rounded-full">
                                        <Check size={24} className="font-black" />
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className={`p-4 text-center transition-colors ${selectedUrl === img.url
                                ? 'bg-accent text-black'
                                : 'bg-black/80'
                            }`}>
                            <span className="text-xs font-black uppercase tracking-wider">
                                {img.style}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <button
                onClick={onSave}
                disabled={!selectedUrl || loading}
                className="w-full py-6 bg-accent text-black font-black uppercase tracking-[0.2em] rounded-xl hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(204,255,0,0.2)] hover:shadow-[0_0_50px_rgba(204,255,0,0.4)]"
            >
                {loading ? "Saving..." : "Save Blog with Selected Image"}
            </button>
        </div>
    )
}
