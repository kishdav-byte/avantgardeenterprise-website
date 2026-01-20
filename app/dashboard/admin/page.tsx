"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/Navbar"
import { DashboardSidebar } from "@/components/DashboardSidebar"
import { motion, AnimatePresence } from "framer-motion"
import { Copy, Plus, Wand2, RefreshCw, Loader2, Image as ImageIcon, Save, Send, Trash2, Eye, Calendar, Bot, MessageSquare, Shield, Settings, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

type Tab = 'blog' | 'bot' | 'leads'

export default function AdminDashboard() {
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const [activeTab, setActiveTab] = useState<Tab>('blog')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)

    // --- BLOG STATE ---
    const [generatingKeywords, setGeneratingKeywords] = useState(false)
    const [topic, setTopic] = useState("")
    const [focus, setFocus] = useState("")
    const [productName, setProductName] = useState("")
    const [productUrl, setProductUrl] = useState("")
    const [keywords, setKeywords] = useState("")
    const [length, setLength] = useState("1200")
    const [authorName, setAuthorName] = useState('Avant-Garde Team')
    const [imageStyle, setImageStyle] = useState("Minimalist")
    const [generatedBlog, setGeneratedBlog] = useState<any>(null)
    const [blogs, setBlogs] = useState<any[]>([])
    const [editingBlog, setEditingBlog] = useState<any>(null)
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    // --- BOT STATE ---
    const [botGreeting, setBotGreeting] = useState("")
    const [botInstructions, setBotInstructions] = useState("")
    const [botConfigId, setBotConfigId] = useState<string | null>(null)

    // --- LEADS STATE ---
    const [leads, setLeads] = useState<any[]>([])

    useEffect(() => {
        if (activeTab === 'blog') fetchBlogs()
        if (activeTab === 'bot') fetchBotConfig()
        if (activeTab === 'leads') fetchLeads()
    }, [activeTab, refreshTrigger, generatedBlog])

    const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
        setMessage({ text, type })
        setTimeout(() => setMessage(null), 5000)
    }

    // --- BLOG FUNCTIONS ---
    async function fetchBlogs() {
        const { data, error } = await supabase.from('blogs').select('*').order('created_at', { ascending: false })
        if (data) setBlogs(data)
    }

    async function deleteBlog(id: string) {
        if (!confirm("Permanently delete this blog post?")) return
        setLoading(true)
        try {
            const { error } = await supabase.from('blogs').delete().eq('id', id)
            if (error) throw error
            showMsg("Blog deleted successfully.")
            fetchBlogs()
        } catch (error: any) {
            showMsg(error.message, 'error')
        } finally {
            setLoading(false)
        }
    }

    async function handleUpdateBlog() {
        if (!editingBlog) return
        setLoading(true)
        try {
            const res = await fetch(`/api/blog/${editingBlog.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: editingBlog.content,
                    title: editingBlog.title,
                    status: editingBlog.status
                }),
            })
            const data = await res.json()
            if (data.error) throw new Error(data.error)
            showMsg("Blog updated successfully!")
            setEditingBlog(null)
            fetchBlogs()
        } catch (error: any) {
            showMsg(error.message, 'error')
        } finally {
            setLoading(false)
        }
    }

    async function handleSuggestKeywords() {
        if (!topic || !focus) return alert("Please enter a Topic and Focus first.")
        setGeneratingKeywords(true)
        try {
            const res = await fetch("/api/generate-keywords", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ topic, focus }),
            })
            const data = await res.json()
            if (data.keywords) setKeywords(data.keywords)
        } catch (e) { console.error(e) } finally { setGeneratingKeywords(false) }
    }

    async function handleGenerate() {
        setLoading(true)
        setGeneratedBlog(null)
        try {
            const res = await fetch("/api/generate-blog", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ topic, focus, keywords, productName, productUrl, authorName, length, imageStyle }),
            })
            const data = await res.json()
            if (data.error) throw new Error(data.error)
            setGeneratedBlog(data.blog)
            showMsg("Blog generated successfully!")
        } catch (error: any) { showMsg(error.message, 'error') } finally { setLoading(false) }
    }

    // --- BOT FUNCTIONS ---
    async function fetchBotConfig() {
        const { data, error } = await supabase.from('bot_config').select('*').eq('key', 'architect_config').maybeSingle()
        if (data) {
            setBotGreeting(data.value.greeting)
            setBotInstructions(data.value.system_prompt)
            setBotConfigId(data.id)
        }
    }

    async function handleSaveBotConfig() {
        setLoading(true)
        try {
            const config = {
                greeting: botGreeting,
                system_prompt: botInstructions
            }

            const { error } = await supabase
                .from('bot_config')
                .upsert({
                    key: 'architect_config',
                    value: config,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'key' })

            if (error) throw error
            showMsg("Architect Protocol updated successfully.")
        } catch (error: any) {
            showMsg(error.message, 'error')
        } finally {
            setLoading(false)
        }
    }

    // --- LEADS FUNCTIONS ---
    async function fetchLeads() {
        const { data, error } = await supabase.from('inquiries').select('*').order('created_at', { ascending: false })
        if (data) setLeads(data)
    }

    async function deleteLead(id: string) {
        if (!confirm("Delete this inquiry?")) return
        const { error } = await supabase.from('inquiries').delete().eq('id', id)
        if (!error) fetchLeads()
    }

    return (
        <main className="min-h-screen bg-black text-white">
            <Navbar />
            <div className="pt-24 flex min-h-screen">
                <DashboardSidebar isAdmin={true} />

                <section className="flex-1 p-8 md:p-12 overflow-y-auto">
                    <div className="max-w-6xl mx-auto space-y-12">
                        {/* Header & Tabs */}
                        <header className="space-y-8">
                            <div>
                                <h1 className="text-5xl font-black tracking-tighter uppercase italic">Admin <span className="text-accent">Commander</span></h1>
                                <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Avant-Garde Enterprise // Central Control</p>
                            </div>

                            <div className="flex gap-1 bg-white/5 p-1 rounded-xl w-fit border border-white/10">
                                <button
                                    onClick={() => setActiveTab('blog')}
                                    className={`px-6 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'blog' ? 'bg-accent text-black' : 'hover:bg-white/5 opacity-50'}`}
                                >
                                    <ImageIcon size={14} /> Blog Commander
                                </button>
                                <button
                                    onClick={() => setActiveTab('bot')}
                                    className={`px-6 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'bot' ? 'bg-accent text-black' : 'hover:bg-white/5 opacity-50'}`}
                                >
                                    <Bot size={14} /> Bot Architect
                                </button>
                                <button
                                    onClick={() => setActiveTab('leads')}
                                    className={`px-6 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'leads' ? 'bg-accent text-black' : 'hover:bg-white/5 opacity-50'}`}
                                >
                                    <MessageSquare size={14} /> Intelligence Leads
                                </button>
                            </div>
                        </header>

                        {message && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`p-4 rounded-xl border flex items-center justify-between ${message.type === 'error' ? 'bg-red-500/10 border-red-500/50 text-red-200' : 'bg-accent/10 border-accent/50 text-accent'}`}
                            >
                                <span className="text-xs font-bold uppercase tracking-widest">{message.text}</span>
                                <button onClick={() => setMessage(null)}><Trash2 size={14} /></button>
                            </motion.div>
                        )}

                        <AnimatePresence mode="wait">
                            {activeTab === 'blog' && (
                                <motion.div
                                    key="blog"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="grid grid-cols-1 lg:grid-cols-2 gap-12"
                                >
                                    {/* Configuration Section (Previous Logic) */}
                                    <div className="space-y-8">
                                        <div className="bg-white/5 border border-white/10 p-8 rounded-[32px] space-y-8 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none rotate-12">
                                                <ImageIcon size={120} />
                                            </div>
                                            <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3 italic text-accent">
                                                <Wand2 size={24} /> Configuration
                                            </h2>
                                            <div className="space-y-6">
                                                <InputGroup label="Topic / Title Idea">
                                                    <input className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-sm focus:border-accent outline-none" value={topic} onChange={e => setTopic(e.target.value)} placeholder="The Future of AI..." />
                                                </InputGroup>
                                                <InputGroup label="Main Point / Focus">
                                                    <textarea className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-sm focus:border-accent outline-none min-h-[100px]" value={focus} onChange={e => setFocus(e.target.value)} placeholder="Key takeaways and themes..." />
                                                </InputGroup>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <InputGroup label="Product Name"><input className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-sm focus:border-accent outline-none" value={productName} onChange={e => setProductName(e.target.value)} /></InputGroup>
                                                    <InputGroup label="Product URL"><input className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-sm focus:border-accent outline-none" value={productUrl} onChange={e => setProductUrl(e.target.value)} /></InputGroup>
                                                </div>
                                                <InputGroup label="Target Keywords">
                                                    <div className="relative">
                                                        <input className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-sm focus:border-accent outline-none pr-32" value={keywords} onChange={e => setKeywords(e.target.value)} />
                                                        <button onClick={handleSuggestKeywords} disabled={generatingKeywords} className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-2 text-[8px] font-black uppercase bg-accent text-black rounded-lg">
                                                            {generatingKeywords ? "Processing..." : "AI Suggest"}
                                                        </button>
                                                    </div>
                                                </InputGroup>
                                                <Button onClick={handleGenerate} disabled={loading} className="w-full py-8 text-lg font-black uppercase tracking-[0.2em] bg-white text-black hover:bg-accent transition-all">
                                                    {loading ? "Initializing Synapse..." : "Generate Intelligence Post"}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Preview & Archive */}
                                    <div className="space-y-8">
                                        <div className="flex justify-between items-center">
                                            <h2 className="text-2xl font-black uppercase tracking-tighter italic">Preview & <span className="text-accent">Archive</span></h2>
                                            {generatedBlog && (
                                                <Button
                                                    onClick={() => {
                                                        setEditingBlog(generatedBlog)
                                                        setGeneratedBlog(null)
                                                    }}
                                                    className="bg-accent text-black scale-75 uppercase font-black"
                                                >
                                                    Edit Generation
                                                </Button>
                                            )}
                                        </div>

                                        {!generatedBlog && !editingBlog ? (
                                            <div className="space-y-4">
                                                {blogs.map((blog) => (
                                                    <div key={blog.id} className="bg-white/5 border border-white/10 p-6 rounded-3xl hover:border-accent/30 transition-all group">
                                                        <div className="flex justify-between items-center mb-4">
                                                            <div className="flex items-center gap-4">
                                                                <div className={`w-2 h-2 rounded-full ${blog.status === 'published' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                                                <div>
                                                                    <h3 className="text-sm font-black uppercase tracking-tight line-clamp-1">{blog.title}</h3>
                                                                    <p className="text-[8px] font-bold opacity-30 uppercase tracking-[0.2em]">{new Date(blog.created_at).toLocaleDateString()}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <button onClick={() => setEditingBlog(blog)} className="p-2 text-white/20 hover:text-accent transition-colors"><Eye size={16} /></button>
                                                                <button onClick={() => deleteBlog(blog.id)} className="p-2 text-white/20 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <span className="text-[8px] font-black px-2 py-1 bg-white/5 rounded-md opacity-40 uppercase">{blog.author_name || 'System'}</span>
                                                            <span className="text-[8px] font-black px-2 py-1 bg-accent/20 text-accent rounded-md uppercase">SEO: {blog.seo_score}%</span>
                                                        </div>
                                                    </div>
                                                ))}
                                                {blogs.length === 0 && (
                                                    <div className="aspect-video bg-white/5 border border-white/10 border-dashed rounded-[32px] flex flex-col items-center justify-center text-white/20">
                                                        <Wand2 size={48} className="mb-4 opacity-10" />
                                                        <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Neural Link...</p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : editingBlog ? (
                                            <div className="bg-white/5 border border-white/10 p-8 rounded-[32px] space-y-6">
                                                <div className="flex justify-between items-center">
                                                    <h3 className="text-xl font-black uppercase tracking-tighter italic text-accent">Edit Analysis</h3>
                                                    <button onClick={() => setEditingBlog(null)} className="text-white/40 hover:text-white"><Plus className="rotate-45" /></button>
                                                </div>
                                                <div className="space-y-4">
                                                    <InputGroup label="Title">
                                                        <input className="w-full bg-black border border-white/10 p-4 rounded-xl text-sm focus:border-accent outline-none font-bold" value={editingBlog.title} onChange={e => setEditingBlog({ ...editingBlog, title: e.target.value })} />
                                                    </InputGroup>
                                                    <InputGroup label="Protocol Status">
                                                        <select className="w-full bg-black border border-white/10 p-4 rounded-xl text-sm focus:border-accent outline-none appearance-none font-black uppercase tracking-widest" value={editingBlog.status} onChange={e => setEditingBlog({ ...editingBlog, status: e.target.value })}>
                                                            <option value="draft">Draft</option>
                                                            <option value="published">Published</option>
                                                        </select>
                                                    </InputGroup>
                                                    <InputGroup label="Neural Content">
                                                        <textarea className="w-full bg-black border border-white/10 p-4 rounded-xl text-xs focus:border-accent outline-none min-h-[300px] leading-relaxed font-mono" value={editingBlog.content} onChange={e => setEditingBlog({ ...editingBlog, content: e.target.value })} />
                                                    </InputGroup>
                                                    <div className="flex gap-4">
                                                        <Button onClick={handleUpdateBlog} disabled={loading} className="flex-1 py-6 bg-accent text-black font-black uppercase">Commit Changes</Button>
                                                        <Button onClick={() => setEditingBlog(null)} variant="outline" className="py-6 border-white/10 font-black uppercase">Cancel</Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-white/5 border border-white/10 p-8 rounded-[32px] space-y-6">
                                                <img src={generatedBlog.featured_image} className="w-full aspect-video object-cover rounded-2xl" />
                                                <h3 className="text-2xl font-bold">{generatedBlog.title}</h3>
                                                <div className="prose prose-invert max-h-[400px] overflow-y-auto text-sm opacity-60" dangerouslySetInnerHTML={{ __html: generatedBlog.content }} />
                                                <div className="flex gap-4">
                                                    <Button onClick={() => {
                                                        setEditingBlog(generatedBlog)
                                                        setGeneratedBlog(null)
                                                    }} className="flex-1 py-6 bg-accent text-black font-black uppercase">Refine & Save</Button>
                                                    <Button onClick={() => setGeneratedBlog(null)} variant="outline" className="py-6 border-white/10 font-black uppercase">Dismiss</Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'bot' && (
                                <motion.div
                                    key="bot"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="max-w-4xl mx-auto space-y-12"
                                >
                                    <div className="bg-white/5 border border-white/10 p-12 rounded-[48px] space-y-12 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                                            <Bot size={240} />
                                        </div>

                                        <div className="space-y-4">
                                            <h2 className="text-4xl font-black tracking-tighter uppercase italic text-accent">Protocol Training</h2>
                                            <p className="text-white/40 text-sm max-w-xl">Configure the behavior, personality, and specialized knowledge of the site's primary AI Architect.</p>
                                        </div>

                                        <div className="space-y-10">
                                            <InputGroup label="Architect Greeting // Transmission 001">
                                                <input
                                                    className="w-full bg-white/5 border border-white/10 p-6 rounded-2xl text-lg font-bold italic focus:border-accent outline-none"
                                                    value={botGreeting}
                                                    onChange={e => setBotGreeting(e.target.value)}
                                                    placeholder="e.g. Laying the foundation..."
                                                />
                                            </InputGroup>

                                            <InputGroup label="Neural Instructions // Deep Training">
                                                <textarea
                                                    className="w-full bg-white/5 border border-white/10 p-8 rounded-[32px] text-sm leading-relaxed focus:border-accent outline-none min-h-[400px]"
                                                    value={botInstructions}
                                                    onChange={e => setBotInstructions(e.target.value)}
                                                    placeholder="Define the bot's identity, knowledge base, and tone rules..."
                                                />
                                            </InputGroup>

                                            <Button
                                                onClick={handleSaveBotConfig}
                                                disabled={loading}
                                                className="w-full py-8 text-xl font-black uppercase tracking-[0.3em] bg-accent text-black hover:bg-white transition-all shadow-[0_0_50px_rgba(204,255,0,0.2)]"
                                            >
                                                {loading ? "Updating Neural Network..." : "Save Architect Protocol"}
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'leads' && (
                                <motion.div
                                    key="leads"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-8"
                                >
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-3xl font-black uppercase tracking-tighter italic">Incoming <span className="text-accent">Signals</span></h2>
                                        <div className="text-[10px] font-black uppercase tracking-widest opacity-40">{leads.length} Inquiries Detected</div>
                                    </div>

                                    <div className="grid gap-4">
                                        {leads.map(lead => (
                                            <div key={lead.id} className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:border-accent/30 transition-all group">
                                                <div className="flex justify-between items-start mb-6">
                                                    <div>
                                                        <div className="text-lg font-black uppercase tracking-widest mb-1">{lead.name}</div>
                                                        <div className="text-accent text-[10px] font-bold uppercase tracking-widest">{lead.email}</div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-[8px] font-black uppercase text-white/20">{new Date(lead.created_at).toLocaleString()}</div>
                                                        <button
                                                            onClick={() => deleteLead(lead.id)}
                                                            className="p-2 text-white/20 hover:text-red-500 transition-colors"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="p-6 bg-black/40 rounded-2xl text-sm leading-relaxed text-white/60 font-medium border border-white/5 group-hover:border-white/10 transition-colors">
                                                    {lead.message}
                                                </div>
                                            </div>
                                        ))}
                                        {leads.length === 0 && (
                                            <div className="py-20 text-center text-white/20 text-xs font-black uppercase tracking-[0.4em]">No signals detected on the frequency.</div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </section>
            </div>
        </main>
    )
}

function InputGroup({ label, children }: { label: string, children: React.ReactNode }) {
    return (
        <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.4em] text-accent/60 ml-1">{label}</label>
            {children}
        </div>
    )
}
