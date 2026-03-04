"use client"

import { useState, useEffect } from 'react'
import { X, Eye, Code, RefreshCw, Wand2, Volume2, Square, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BlogPreviewProps {
    blog: {
        title: string
        content: string
        featured_image?: string
        excerpt?: string
        author_name?: string
        created_at?: string
    }
    onClose: () => void
    onRegenerateImage?: () => void
    isRegeneratingImage?: boolean
}

export function BlogPreview({ blog, onClose, onRegenerateImage, isRegeneratingImage = false }: BlogPreviewProps) {
    const [viewMode, setViewMode] = useState<'preview' | 'html'>('preview')
    const [isPlaying, setIsPlaying] = useState(false)
    const [isLoadingAudio, setIsLoadingAudio] = useState(false)
    const [audio, setAudio] = useState<HTMLAudioElement | null>(null)

    useEffect(() => {
        return () => {
            if (audio) {
                audio.pause()
                audio.src = ''
            }
        }
    }, [audio])

    const handleToggleAudio = async () => {
        if (isPlaying && audio) {
            audio.pause()
            setIsPlaying(false)
            return
        }

        if (audio && audio.src) {
            audio.play()
            setIsPlaying(true)
            return
        }

        setIsLoadingAudio(true)
        try {
            const fullText = `${blog.title}. ${blog.excerpt || ''}. ${blog.content}`
                .replace(/<[^>]*>?/gm, ' ')
                .replace(/\s+/g, ' ')
                .trim()

            const res = await fetch('/api/admin/blog/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: fullText })
            })

            if (!res.ok) throw new Error('Failed to generate audio')

            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const newAudio = new Audio(url)

            newAudio.onended = () => setIsPlaying(false)

            setAudio(newAudio)
            newAudio.play()
            setIsPlaying(true)
        } catch (error) {
            console.error('Audio playback error:', error)
            alert('Failed to play audio preview')
        } finally {
            setIsLoadingAudio(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-black border border-white/10 rounded-[32px] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div className="flex items-center gap-4">
                        <h3 className="text-2xl font-black uppercase tracking-tighter italic text-accent">
                            Blog Preview
                        </h3>

                        {/* View Mode Toggle */}
                        <div className="flex gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
                            <button
                                onClick={handleToggleAudio}
                                disabled={isLoadingAudio}
                                className={`px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${isPlaying
                                    ? 'bg-accent text-black'
                                    : 'hover:bg-white/5 opacity-50'
                                    } ${isLoadingAudio ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isLoadingAudio ? (
                                    <Loader2 size={12} className="animate-spin" />
                                ) : isPlaying ? (
                                    <Square size={12} fill="currentColor" />
                                ) : (
                                    <Volume2 size={12} />
                                )}
                                {isLoadingAudio ? 'Loading...' : isPlaying ? 'Stop Audio' : 'Play Audio'}
                            </button>
                            <div className="w-px h-auto bg-white/10 mx-1"></div>
                            <button
                                onClick={() => setViewMode('preview')}
                                className={`px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'preview'
                                    ? 'bg-accent text-black'
                                    : 'hover:bg-white/5 opacity-50'
                                    }`}
                            >
                                <Eye size={12} />
                                Preview
                            </button>
                            <button
                                onClick={() => setViewMode('html')}
                                className={`px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'html'
                                    ? 'bg-accent text-black'
                                    : 'hover:bg-white/5 opacity-50'
                                    }`}
                            >
                                <Code size={12} />
                                HTML
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <X size={24} className="text-white/60 hover:text-white" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    {viewMode === 'preview' ? (
                        <div className="max-w-4xl mx-auto">
                            {/* Blog Post Preview - Styled like actual blog */}
                            <article className="space-y-8">
                                {/* Featured Image */}
                                {blog.featured_image && (
                                    <div className="relative group">
                                        <img
                                            src={blog.featured_image}
                                            alt={blog.title}
                                            className="w-full aspect-video object-cover rounded-2xl"
                                        />

                                        {/* Regenerate Image Button */}
                                        {onRegenerateImage && (
                                            <button
                                                onClick={onRegenerateImage}
                                                disabled={isRegeneratingImage}
                                                className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm border border-white/10 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-accent hover:bg-accent hover:text-black transition-all flex items-center gap-2 opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                            >
                                                {isRegeneratingImage ? (
                                                    <>
                                                        <RefreshCw size={14} className="animate-spin" />
                                                        Generating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Wand2 size={14} />
                                                        Regenerate Image
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Meta Info */}
                                <div className="flex items-center gap-4 text-sm text-white/40">
                                    {blog.author_name && (
                                        <span className="font-bold uppercase tracking-wider">
                                            By {blog.author_name}
                                        </span>
                                    )}
                                    {blog.created_at && (
                                        <span className="font-bold uppercase tracking-wider">
                                            {new Date(blog.created_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </span>
                                    )}
                                </div>

                                {/* Title */}
                                <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight">
                                    {blog.title}
                                </h1>

                                {/* Excerpt */}
                                {blog.excerpt && (
                                    <p className="text-xl text-white/60 leading-relaxed italic border-l-4 border-accent pl-6">
                                        {blog.excerpt}
                                    </p>
                                )}

                                {/* Divider */}
                                <div className="flex items-center gap-3 py-4">
                                    <div className="flex-1 h-px bg-white/10" />
                                    <div className="w-2 h-2 bg-accent rounded-full" />
                                    <div className="flex-1 h-px bg-white/10" />
                                </div>

                                {/* Content */}
                                <div
                                    className="prose prose-invert prose-lg max-w-none
                                        prose-headings:font-black prose-headings:tracking-tighter prose-headings:uppercase
                                        prose-h2:text-3xl prose-h2:text-accent prose-h2:mb-6 prose-h2:mt-12
                                        prose-p:text-white/80 prose-p:leading-relaxed prose-p:mb-6
                                        prose-a:text-accent prose-a:no-underline hover:prose-a:underline
                                        prose-strong:text-white prose-strong:font-black
                                        prose-blockquote:border-l-4 prose-blockquote:border-accent prose-blockquote:pl-6 prose-blockquote:italic
                                        prose-ul:list-disc prose-ul:pl-6 prose-ul:space-y-2
                                        prose-li:text-white/80"
                                    dangerouslySetInnerHTML={{ __html: blog.content }}
                                />
                            </article>
                        </div>
                    ) : (
                        <div className="bg-black/40 border border-white/5 rounded-xl p-6">
                            <pre className="text-xs text-white/60 font-mono overflow-x-auto leading-relaxed">
                                {blog.content}
                            </pre>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 flex justify-end gap-4">
                    <Button
                        onClick={onClose}
                        variant="outline"
                        className="border-white/10 font-black uppercase tracking-wider"
                    >
                        Close Preview
                    </Button>
                </div>
            </div>
        </div>
    )
}
