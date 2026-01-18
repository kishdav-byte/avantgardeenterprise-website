"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/Navbar"
import { DashboardSidebar } from "@/components/DashboardSidebar"
import { motion, AnimatePresence } from "framer-motion"
import { Copy, Plus, Wand2, RefreshCw, Loader2, Image as ImageIcon, Save, Send } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AdminDashboard() {
    const [loading, setLoading] = useState(false)
    const [generatingKeywords, setGeneratingKeywords] = useState(false)
    const [message, setMessage] = useState<string | null>(null)

    // Form Stats
    const [topic, setTopic] = useState("")
    const [focus, setFocus] = useState("")
    const [productName, setProductName] = useState("")
    const [productUrl, setProductUrl] = useState("")
    const [keywords, setKeywords] = useState("") // comma separated

    // Result State
    const [generatedBlog, setGeneratedBlog] = useState<any>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [editContent, setEditContent] = useState("")

    async function handleSuggestKeywords() {
        if (!topic || !focus) {
            alert("Please enter a Topic and Focus first.")
            return
        }
        setGeneratingKeywords(true)
        try {
            const res = await fetch("/api/generate-keywords", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ topic, focus }),
            })
            const data = await res.json()
            if (data.keywords) {
                setKeywords(data.keywords)
            } else {
                alert("Failed to generate keywords")
            }
        } catch (e) {
            console.error(e)
            alert("Error generating keywords")
        } finally {
            setGeneratingKeywords(false)
        }
    }

    async function handleGenerate() {
        setLoading(true)
        setMessage(null)
        setGeneratedBlog(null)

        try {
            const res = await fetch("/api/generate-blog", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    topic,
                    focus,
                    keywords,
                    productName,
                    productUrl
                }),
            })

            const data = await res.json()

            if (data.error) throw new Error(data.error)

            setGeneratedBlog(data.blog)
            setEditContent(data.blog.content)
            setMessage("Blog generated successfully! Saved as Draft.")

        } catch (error: any) {
            console.error(error)
            setMessage(`Error: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    async function handleUpdate() {
        if (!generatedBlog) return
        setLoading(true)
        try {
            const res = await fetch(`/api/blog/${generatedBlog.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: editContent,
                    title: generatedBlog.title, // or allow editing title too
                    social_snippets: generatedBlog.generated_social_snippets
                }),
            })
            const data = await res.json()
            if (data.error) throw new Error(data.error)

            setGeneratedBlog(data.blog)
            setIsEditing(false)
            setMessage("Blog updated successfully!")
        } catch (error: any) {
            setMessage(`Update Error: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    async function handlePublish() {
        if (!generatedBlog) return
        if (!confirm("Are you sure you want to maximize visibility and PUBLISH this post?")) return

        setLoading(true)
        try {
            const res = await fetch(`/api/blog/${generatedBlog.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "published" }),
            })
            const data = await res.json()
            if (data.error) throw new Error(data.error)

            setGeneratedBlog(data.blog)
            setMessage("Blog PUBLISHED successfully!")
        } catch (error: any) {
            setMessage(`Publish Error: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-8 pb-20">
            <header className="flex items-center justify-between border-b border-white/10 pb-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter uppercase">Blog Commander</h1>
                    <p className="text-white/40 text-sm tracking-widest uppercase mt-2">AI-Powered Content Generation</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* LEFT: Configuration */}
                <div className="space-y-8">
                    <div className="bg-white/5 border border-white/10 p-6 rounded-xl space-y-6">
                        <h2 className="text-xl font-bold uppercase tracking-wider flex items-center gap-2">
                            <Wand2 className="text-accent" size={20} /> Configuration
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Topic / Title Idea</label>
                                <input
                                    className="w-full bg-black/50 border border-white/20 p-3 rounded text-white focus:border-accent outline-none font-medium"
                                    placeholder="e.g. The Future of AI Consulting"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Main Point / Focus</label>
                                <textarea
                                    className="w-full bg-black/50 border border-white/20 p-3 rounded text-white focus:border-accent outline-none font-medium text-sm min-h-[80px]"
                                    placeholder="What is the key takeaway? (Used for keywords and blog prompt)"
                                    value={focus}
                                    onChange={(e) => setFocus(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Product Name</label>
                                    <input
                                        className="w-full bg-black/50 border border-white/20 p-3 rounded text-white focus:border-accent outline-none font-medium text-sm"
                                        placeholder="e.g. Total Package Interview"
                                        value={productName}
                                        onChange={(e) => setProductName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Product URL</label>
                                    <input
                                        className="w-full bg-black/50 border border-white/20 p-3 rounded text-white focus:border-accent outline-none font-medium text-sm"
                                        placeholder="https://..."
                                        value={productUrl}
                                        onChange={(e) => setProductUrl(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-xs font-bold uppercase tracking-widest text-white/50">Target Keywords</label>
                                    <button
                                        onClick={handleSuggestKeywords}
                                        disabled={generatingKeywords}
                                        className="text-[10px] uppercase font-bold text-accent hover:text-white flex items-center gap-1"
                                    >
                                        {generatingKeywords ? <Loader2 className="animate-spin" size={12} /> : <RefreshCw size={12} />}
                                        Suggest AI Keywords
                                    </button>
                                </div>
                                <input
                                    className="w-full bg-black/50 border border-white/20 p-3 rounded text-white focus:border-accent outline-none font-medium text-sm"
                                    placeholder="Consulting, AI Trends, Business Growth..."
                                    value={keywords}
                                    onChange={(e) => setKeywords(e.target.value)}
                                />
                            </div>

                            <Button
                                onClick={handleGenerate}
                                disabled={loading}
                                className="w-full py-6 text-lg font-black uppercase tracking-widest bg-accent text-black hover:bg-white transition-all"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2"><Loader2 className="animate-spin" /> Generating...</span>
                                ) : (
                                    <span className="flex items-center gap-2"><Wand2 size={20} /> Generate Blog</span>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Preview */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold uppercase tracking-wider">Preview</h2>
                        {generatedBlog && (
                            <div className="flex gap-2">
                                {isEditing ? (
                                    <Button onClick={handleUpdate} size="sm" variant="outline" className="border-accent text-accent">Save Changes</Button>
                                ) : (
                                    <Button onClick={() => setIsEditing(true)} size="sm" variant="ghost">Edit</Button>
                                )}
                                <Button
                                    onClick={handlePublish}
                                    disabled={generatedBlog.status === 'published'}
                                    size="sm"
                                    className={generatedBlog.status === 'published' ? "bg-green-500 text-black" : "bg-white text-black"}
                                >
                                    {generatedBlog.status === 'published' ? "Published" : "Publish Now"}
                                </Button>
                            </div>
                        )}
                    </div>

                    {message && (
                        <div className={`p-4 rounded border ${message.includes('Error') ? 'border-red-500/50 bg-red-500/10 text-red-200' : 'border-green-500/50 bg-green-500/10 text-green-200'}`}>
                            {message}
                        </div>
                    )}

                    {!generatedBlog ? (
                        <div className="bg-white/5 border border-white/10 border-dashed rounded-xl h-[500px] flex flex-col items-center justify-center text-white/20">
                            <Wand2 size={48} className="mb-4 opacity-20" />
                            <p className="uppercase tracking-widest text-sm">Waiting for generation...</p>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            {/* Generated Image Preview */}
                            {generatedBlog.featured_image && (
                                <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 group">
                                    <img src={generatedBlog.featured_image} alt="Generated Blog Header" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <a href={generatedBlog.featured_image} target="_blank" rel="noopener noreferrer" className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:text-accent">
                                            <ImageIcon size={16} /> Open Full Size
                                        </a>
                                    </div>
                                </div>
                            )}

                            {isEditing ? (
                                <textarea
                                    className="w-full h-[600px] bg-black/50 border border-white/20 p-6 rounded-xl font-mono text-sm text-white/80 focus:border-accent outline-none leading-relaxed"
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                />
                            ) : (
                                <div className="bg-white text-black p-8 rounded-xl prose max-w-none">
                                    <div dangerouslySetInnerHTML={{ __html: generatedBlog.content }} />
                                </div>
                            )}

                            {/* Social Parsers */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-[#0077b5] p-6 rounded-xl text-white">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold">LinkedIn</h3>
                                        <Button size="icon" variant="ghost" className="hover:bg-white/20 h-8 w-8" onClick={() => navigator.clipboard.writeText(generatedBlog.generated_social_snippets?.linkedin)}>
                                            <Copy size={14} />
                                        </Button>
                                    </div>
                                    <p className="text-sm whitespace-pre-wrap">{generatedBlog.generated_social_snippets?.linkedin}</p>
                                </div>
                                <div className="bg-[#1877F2] p-6 rounded-xl text-white">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold">Facebook</h3>
                                        <Button size="icon" variant="ghost" className="hover:bg-white/20 h-8 w-8" onClick={() => navigator.clipboard.writeText(generatedBlog.generated_social_snippets?.facebook)}>
                                            <Copy size={14} />
                                        </Button>
                                    </div>
                                    <p className="text-sm whitespace-pre-wrap">{generatedBlog.generated_social_snippets?.facebook}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function InputGroup({ label, children }: { label: string, children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/50">{label}</label>
            {children}
        </div>
    )
}
