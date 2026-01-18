"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/Navbar"
import { DashboardSidebar } from "@/components/DashboardSidebar"
import { motion, AnimatePresence } from "framer-motion"
import { Copy, Plus, Wand2, RefreshCw, Loader2, Image as ImageIcon, Save, Send, Trash2, Eye, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

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
    const [length, setLength] = useState("1200")
    const [imageStyle, setImageStyle] = useState("Minimalist")

    // Result State
    const [generatedBlog, setGeneratedBlog] = useState<any>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [editContent, setEditContent] = useState("")

    // Archive State
    const [blogs, setBlogs] = useState<any[]>([])
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    useEffect(() => {
        fetchBlogs()
    }, [refreshTrigger, generatedBlog])

    async function fetchBlogs() {
        const { data, error } = await supabase
            .from('blogs')
            .select('*')
            .order('created_at', { ascending: false })

        if (data) setBlogs(data)
        if (error) console.error("Error fetching blogs:", error)
    }

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
                    productUrl,
                    length,
                    imageStyle
                }),
            })

            const data = await res.json()

            if (data.error) throw new Error(data.error)

            setGeneratedBlog(data.blog)
            setEditContent(data.blog.content)
            setMessage("Blog generated successfully! Saved as Draft.")
            setRefreshTrigger(prev => prev + 1)

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
            setRefreshTrigger(prev => prev + 1)
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
            setRefreshTrigger(prev => prev + 1)
        } catch (error: any) {
            setMessage(`Publish Error: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    // Archive Functions
    async function togglePublishStatus(blog: any) {
        const newStatus = blog.status === 'published' ? 'draft' : 'published'
        const { error } = await supabase
            .from('blogs')
            .update({ status: newStatus })
            .eq('id', blog.id)

        if (error) {
            alert("Error updating status: " + error.message)
        } else {
            setRefreshTrigger(prev => prev + 1)
        }
    }

    async function updatePublishedDate(blogId: string, newDate: string) {
        const { error } = await supabase
            .from('blogs')
            .update({ published_at: newDate })
            .eq('id', blogId)

        if (error) {
            alert("Error updating date: " + error.message)
        } else {
            setRefreshTrigger(prev => prev + 1)
        }
    }

    async function deleteBlog(blogId: string) {
        if (!confirm("Are you sure you want to delete this blog? This cannot be undone.")) return
        const { error } = await supabase.from('blogs').delete().eq('id', blogId)
        if (error) alert("Error deleting: " + error.message)
        else setRefreshTrigger(prev => prev + 1)
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

                            {/* NEW: Length and Style */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Length</label>
                                    <select
                                        className="w-full bg-black/50 border border-white/20 p-3 rounded text-white focus:border-accent outline-none font-bold text-sm uppercase"
                                        value={length}
                                        onChange={(e) => setLength(e.target.value)}
                                    >
                                        <option value="800">Short (~800 words)</option>
                                        <option value="1200">Medium (~1200 words)</option>
                                        <option value="2000">Long (~2000 words)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Image Style</label>
                                    <div className="flex flex-col gap-2">
                                        {['Minimalist', 'Cyberpunk', 'Professional', 'Abstract'].map((style) => (
                                            <label key={style} className="flex items-center gap-2 cursor-pointer group">
                                                <input
                                                    type="radio"
                                                    name="imageStyle"
                                                    value={style}
                                                    checked={imageStyle === style}
                                                    onChange={(e) => setImageStyle(e.target.value)}
                                                    className="accent-accent"
                                                />
                                                <span className={`text-xs font-bold uppercase tracking-widest transition-colors ${imageStyle === style ? 'text-accent' : 'text-white/50 group-hover:text-white'}`}>
                                                    {style}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
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

            {/* ARCHIVE SECTION */}
            <div className="mt-20 border-t border-white/10 pt-12">
                <h2 className="text-2xl font-black uppercase tracking-wider mb-8 flex items-center gap-3">
                    <Calendar className="text-accent" /> Blog Archive
                </h2>

                <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-white/5">
                            <tr>
                                <th className="p-4 text-xs font-bold uppercase tracking-widest text-white/50">Title</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-widest text-white/50">Status</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-widest text-white/50">Published Date</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-widest text-white/50 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {blogs.map(blog => (
                                <tr key={blog.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <div className="font-bold text-white mb-1 line-clamp-1">{blog.title}</div>
                                        <div className="text-xs text-white/40 font-mono">{blog.slug}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${blog.status === 'published' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'}`}>
                                            {blog.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <input
                                            type="date"
                                            className="bg-transparent border border-white/20 rounded p-1 text-xs text-white/70 focus:border-accent outline-none"
                                            value={blog.published_at ? new Date(blog.published_at).toISOString().split('T')[0] : ''}
                                            onChange={(e) => updatePublishedDate(blog.id, e.target.value)}
                                        />
                                    </td>
                                    <td className="p-4 text-right flex items-center justify-end gap-2">
                                        <Link href={`/blog/${blog.id}`} target="_blank">
                                            <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-white/10 hover:text-white text-white/50">
                                                <Eye size={14} />
                                            </Button>
                                        </Link>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className={`h-8 text-[10px] font-bold uppercase tracking-widest ${blog.status === 'published' ? 'border-red-500/50 text-red-400 hover:bg-red-500/10' : 'border-green-500/50 text-green-400 hover:bg-green-500/10'}`}
                                            onClick={() => togglePublishStatus(blog)}
                                        >
                                            {blog.status === 'published' ? 'Unpublish' : 'Publish'}
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 hover:bg-red-500/20 hover:text-red-500 text-white/30"
                                            onClick={() => deleteBlog(blog.id)}
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {blogs.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-white/30 text-sm uppercase tracking-widest">No blogs found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
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
