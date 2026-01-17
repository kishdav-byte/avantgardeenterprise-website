"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/Navbar"
import { DashboardSidebar } from "@/components/DashboardSidebar"
import { motion, AnimatePresence } from "framer-motion"
import {
    Wand2,
    Save,
    Send,
    Loader2,
    CheckCircle,
    LayoutTemplate,
    Share2,
    Copy,
    Edit3
} from "lucide-react"

export default function AdminDashboard() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [activeTab, setActiveTab] = useState<'create' | 'drafts'>('create')

    // Form State
    const [topic, setTopic] = useState("")
    const [intent, setIntent] = useState("")
    const [keywords, setKeywords] = useState("")
    const [length, setLength] = useState("Medium (800-1200 words)")
    const [links, setLinks] = useState("")

    // Result State
    const [generatedBlog, setGeneratedBlog] = useState<any>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [editContent, setEditContent] = useState("")

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsGenerating(true)
        setGeneratedBlog(null)

        try {
            const response = await fetch('/api/generate-blog', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, intent, keywords, length, links }),
            })

            const data = await response.json()

            if (response.ok) {
                setGeneratedBlog(data.blog)
                setEditContent(data.blog.content)
            } else {
                alert('Error: ' + data.error)
            }
        } catch (error) {
            console.error(error)
            alert('Failed to generate blog')
        } finally {
            setIsGenerating(false)
        }
    }

    const handleUpdate = async (status: 'draft' | 'published') => {
        if (!generatedBlog) return

        try {
            const response = await fetch(`/api/blog/${generatedBlog.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: editContent,
                    status
                }),
            })

            if (response.ok) {
                const { blog } = await response.json()
                setGeneratedBlog(blog)
                setIsEditing(false)
                if (status === 'published') alert('Blog Published Successfully!')
                else alert('Draft Saved!')
            } else {
                alert('Failed to update')
            }
        } catch (error) {
            console.error(error)
            alert('Error updating blog')
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        alert('Copied to clipboard!')
    }

    return (
        <main className="min-h-screen bg-black text-white">
            <Navbar />

            <div className="pt-24 flex min-h-screen">
                <DashboardSidebar isAdmin={true} />

                <section className="flex-1 p-8 md:p-12 overflow-y-auto">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="max-w-6xl mx-auto"
                    >
                        <header className="mb-12">
                            <h1 className="text-4xl font-black tracking-tighter uppercase mb-2 flex items-center gap-4">
                                <Wand2 className="text-accent" size={32} />
                                AI Blog Commander
                            </h1>
                            <p className="text-white/40 text-sm uppercase tracking-[0.2em]">Autonomous Content Generation System</p>
                        </header>

                        {/* Control Tabs */}
                        <div className="flex gap-4 border-b border-white/10 mb-8">
                            <button
                                onClick={() => setActiveTab('create')}
                                className={`pb-4 px-4 text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === 'create' ? 'text-accent border-b-2 border-accent' : 'text-white/30 hover:text-white'}`}
                            >
                                Generate New
                            </button>
                            <button
                                onClick={() => setActiveTab('drafts')}
                                className={`pb-4 px-4 text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === 'drafts' ? 'text-accent border-b-2 border-accent' : 'text-white/30 hover:text-white'}`}
                            >
                                My Drafts (Coming Soon)
                            </button>
                        </div>

                        {activeTab === 'create' && (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                {/* Input Column */}
                                <div className="lg:col-span-4 space-y-8">
                                    <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                                        <h3 className="text-sm font-bold uppercase tracking-tighter mb-6 text-white/50">Configuration</h3>
                                        <form onSubmit={handleGenerate} className="space-y-4">
                                            <InputGroup label="Topic">
                                                <input
                                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-accent focus:outline-none transition-colors"
                                                    placeholder="e.g. The Future of AI"
                                                    value={topic}
                                                    onChange={(e) => setTopic(e.target.value)}
                                                    required
                                                />
                                            </InputGroup>

                                            <InputGroup label="Intent">
                                                <input
                                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-accent focus:outline-none transition-colors"
                                                    placeholder="e.g. Drive leads"
                                                    value={intent}
                                                    onChange={(e) => setIntent(e.target.value)}
                                                />
                                            </InputGroup>

                                            <InputGroup label="Keywords">
                                                <input
                                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-accent focus:outline-none transition-colors"
                                                    placeholder="consulting, AI"
                                                    value={keywords}
                                                    onChange={(e) => setKeywords(e.target.value)}
                                                />
                                            </InputGroup>

                                            <InputGroup label="Length">
                                                <select
                                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-accent focus:outline-none transition-colors"
                                                    value={length}
                                                    onChange={(e) => setLength(e.target.value)}
                                                >
                                                    <option>Short (500 words)</option>
                                                    <option>Medium (800-1200 words)</option>
                                                    <option>Long Form (2000+ words)</option>
                                                </select>
                                            </InputGroup>

                                            <InputGroup label="Links">
                                                <textarea
                                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-accent focus:outline-none transition-colors h-20"
                                                    placeholder="https://..."
                                                    value={links}
                                                    onChange={(e) => setLinks(e.target.value)}
                                                />
                                            </InputGroup>

                                            <button
                                                type="submit"
                                                disabled={isGenerating}
                                                className="w-full bg-white text-black font-black uppercase tracking-widest py-3 text-sm rounded-xl hover:bg-accent transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
                                                {isGenerating ? 'Working...' : 'Generate'}
                                            </button>
                                        </form>
                                    </div>
                                </div>

                                {/* Preview Column */}
                                <div className="lg:col-span-8 space-y-6">
                                    {generatedBlog ? (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="bg-white/5 border border-white/10 p-8 rounded-2xl min-h-[800px] flex flex-col"
                                        >
                                            <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/10">
                                                <div>
                                                    <h3 className="text-xl font-bold uppercase tracking-tighter text-white">{generatedBlog.title}</h3>
                                                    <p className="text-xs text-accent uppercase tracking-widest mt-1">Status: {generatedBlog.status}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    {isEditing ? (
                                                        <button
                                                            onClick={() => handleUpdate('draft')}
                                                            className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-xs font-bold uppercase tracking-widest"
                                                        >
                                                            <Save size={14} /> Save Draft
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => setIsEditing(true)}
                                                            className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-xs font-bold uppercase tracking-widest"
                                                        >
                                                            <Edit3 size={14} /> Edit
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => handleUpdate('published')}
                                                        className="flex items-center gap-2 px-4 py-2 bg-accent text-black rounded-lg hover:bg-accent/80 transition-colors text-xs font-bold uppercase tracking-widest"
                                                    >
                                                        <Send size={14} /> Publish
                                                    </button>
                                                </div>
                                            </div>

                                            {isEditing ? (
                                                <textarea
                                                    className="w-full flex-1 bg-black/30 border border-white/10 rounded-lg p-6 font-mono text-sm text-white/80 focus:border-accent focus:outline-none resize-none leading-relaxed"
                                                    value={editContent}
                                                    onChange={(e) => setEditContent(e.target.value)}
                                                />
                                            ) : (
                                                <div className="prose prose-invert prose-lg max-w-none mb-8 flex-1">
                                                    <div dangerouslySetInnerHTML={{ __html: editContent || generatedBlog.content }} />
                                                </div>
                                            )}

                                            <div className="space-y-4 pt-8 border-t border-white/10 mt-auto">
                                                <h4 className="text-xs font-bold uppercase tracking-widest text-white/50">Social Snippets</h4>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="bg-black/30 p-4 rounded-lg relative group">
                                                        <p className="text-[10px] font-bold text-[#0077b5] mb-2 uppercase">LinkedIn</p>
                                                        <p className="text-xs text-white/80 leading-relaxed pr-6">{generatedBlog.generated_social_snippets?.linkedin}</p>
                                                        <button onClick={() => copyToClipboard(generatedBlog.generated_social_snippets?.linkedin)} className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors">
                                                            <Copy size={16} />
                                                        </button>
                                                    </div>

                                                    <div className="bg-black/30 p-4 rounded-lg relative group">
                                                        <p className="text-[10px] font-bold text-[#1877F2] mb-2 uppercase">Facebook</p>
                                                        <p className="text-xs text-white/80 leading-relaxed pr-6">{generatedBlog.generated_social_snippets?.facebook}</p>
                                                        <button onClick={() => copyToClipboard(generatedBlog.generated_social_snippets?.facebook)} className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors">
                                                            <Copy size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <div className="h-full min-h-[600px] border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-white/20 bg-white/5">
                                            <LayoutTemplate size={48} className="mb-4" />
                                            <p className="text-sm font-bold uppercase tracking-widest">Preview Console</p>
                                            <p className="text-xs mt-2">Awaiting AI Generation...</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </section>
            </div>
        </main>
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
