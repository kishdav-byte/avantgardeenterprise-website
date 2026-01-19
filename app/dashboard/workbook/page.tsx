"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { motion, AnimatePresence } from "framer-motion"
import {
    BarChart3,
    CheckCircle2,
    ChevronRight,
    Clock,
    Compass,
    FileText,
    LayoutDashboard,
    Lightbulb,
    LineChart,
    Rocket,
    Save,
    Target,
    TrendingUp,
    Users
} from "lucide-react"

const modules = [
    { id: 'intro', title: 'Welcome', icon: Compass },
    { id: 'pain-points', title: '1. Pain Points', icon: Clock },
    { id: 'vision', title: '2. Business Vision', icon: Target },
    { id: 'literacy', title: '3. AI Literacy', icon: Lightbulb },
    { id: 'marketing', title: '4. Sales & Service', icon: Users },
    { id: 'data', title: '5. Operations & Data', icon: BarChart3 },
    { id: 'pilot', title: '6. Pilot Planner', icon: Rocket },
    { id: 'roi', title: '7. ROI Calculator', icon: LineChart },
    { id: 'roadmap', title: '8. The Roadmap', icon: TrendingUp },
]

export default function WorkbookPage() {
    const router = useRouter()
    const [activeModule, setActiveModule] = useState('intro')
    const [data, setData] = useState<any>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        fetchUserData()
    }, [])

    const fetchUserData = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            setUser(user)
            const { data: workbook, error } = await supabase
                .from('workbook_data')
                .select('data')
                .eq('user_id', user.id)
                .single()

            if (workbook) {
                setData(workbook.data)
            }
        }
        setLoading(false)
    }

    const saveData = async (newData: any) => {
        setSaving(true)
        const { error } = await supabase
            .from('workbook_data')
            .upsert({
                user_id: user.id,
                data: newData,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' })

        if (error) console.error("Save Error:", error)
        setSaving(false)
    }

    const updateData = (key: string, value: any) => {
        const updated = { ...data, [key]: value }
        setData(updated)
        // Debounce save would be better here, but for now:
        saveData(updated)
    }

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
    )

    return (
        <div className="min-h-screen bg-[#050505] text-white flex">
            {/* Sidebar Navigation */}
            <aside className="w-72 border-r border-white/5 bg-black/40 backdrop-blur-xl p-6 hidden lg:flex flex-col gap-2 h-screen sticky top-0">
                <div className="mb-8 px-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-6 h-6 border border-accent rotate-45 flex items-center justify-center">
                            <div className="w-2 h-2 bg-accent" />
                        </div>
                        <span className="text-sm font-black uppercase tracking-tighter">Workbook</span>
                    </div>
                    <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold">The AI Advantage Plan</p>
                </div>

                {modules.map((m) => {
                    const Icon = m.icon
                    const isActive = activeModule === m.id
                    return (
                        <button
                            key={m.id}
                            onClick={() => setActiveModule(m.id)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${isActive
                                ? 'bg-accent/10 text-accent border border-accent/20'
                                : 'text-white/40 hover:text-white hover:bg-white/5 border border-transparent'
                                }`}
                        >
                            <Icon size={18} className={isActive ? 'text-accent' : 'text-white/20 group-hover:text-white/40'} />
                            <span className="text-xs font-bold uppercase tracking-widest">{m.title}</span>
                        </button>
                    )
                })}

                <div className="mt-auto pt-6 border-t border-white/5 px-4 text-[10px] text-white/20 uppercase tracking-widest leading-relaxed">
                    Logged in as:<br />
                    <span className="text-white/40 lowercase">{user?.email}</span>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-6 lg:p-12 overflow-y-auto max-w-5xl mx-auto">
                <header className="flex justify-between items-start mb-12">
                    <div>
                        <div className="text-accent text-[10px] font-bold uppercase tracking-[0.3em] mb-4">Module {modules.findIndex(m => m.id === activeModule)} // 08</div>
                        <h1 className="text-5xl font-black uppercase tracking-tighter mb-4 italic">
                            {modules.find(m => m.id === activeModule)?.title.split('.')[1] || 'Welcome'}
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all ${saving ? 'border-accent/40 text-accent' : 'border-white/10 text-white/30'
                            }`}>
                            <Save size={12} className={saving ? 'animate-pulse' : ''} />
                            {saving ? 'Syncing...' : 'Autosaved'}
                        </div>
                    </div>
                </header>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeModule}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        {activeModule === 'intro' && (
                            <div className="space-y-8">
                                <div className="bg-white/5 border border-white/10 p-8 rounded-3xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                                    <p className="text-xl text-white/70 leading-relaxed mb-8 italic">
                                        "This workbook is designed to work alongside The AI Advantage. By completing these worksheets, you'll move from understanding AI concepts to implementing them in your business."
                                    </p>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        {[
                                            { label: "Step 1", text: "Read the corresponding book chapter first" },
                                            { label: "Step 2", text: "Complete exercises honestly (Self-assessment is key)" },
                                            { label: "Step 3", text: "Keep this handy during implementation" },
                                            { label: "Step 4", text: "Customize templates for your specific business" },
                                        ].map((step, i) => (
                                            <div key={i} className="flex gap-4 items-start p-4 bg-white/5 rounded-xl border border-white/5">
                                                <span className="text-accent font-black text-lg">0{i + 1}</span>
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-accent/60 mb-1">{step.label}</p>
                                                    <p className="text-sm font-bold opacity-70 leading-snug">{step.text}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setActiveModule('pain-points')}
                                    className="flex items-center gap-2 bg-accent text-black font-black uppercase tracking-widest px-8 py-4 rounded-full hover:scale-105 transition-transform"
                                >
                                    Start Your Implementation <ChevronRight size={20} />
                                </button>
                            </div>
                        )}

                        {activeModule === 'pain-points' && (
                            <div className="space-y-12 pb-24">
                                <section>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                                            <Clock size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold uppercase tracking-tight italic">Worksheet: My "Andrew" Moment</h3>
                                            <p className="text-xs text-white/40 uppercase tracking-widest">Identifying the Time Drains</p>
                                        </div>
                                    </div>

                                    <div className="p-8 bg-white/5 border border-white/10 rounded-3xl space-y-6">
                                        <p className="text-sm text-white/60 leading-relaxed">
                                            Think about Andrew's pizzeria story. He was passionate about making pizza but drowning in manual processes. List the top 5 tasks that consume your time but don't directly generate revenue.
                                        </p>

                                        <div className="space-y-4">
                                            {[1, 2, 3, 4, 5].map((i) => (
                                                <div key={i} className="grid grid-cols-12 gap-4">
                                                    <div className="col-span-1 flex items-center justify-center text-accent font-black">{i}</div>
                                                    <div className="col-span-8">
                                                        <input
                                                            type="text"
                                                            value={data[`drain_task_${i}`] || ''}
                                                            onChange={(e) => updateData(`drain_task_${i}`, e.target.value)}
                                                            placeholder="Task Description..."
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent/40 outline-none transition-all"
                                                        />
                                                    </div>
                                                    <div className="col-span-3">
                                                        <input
                                                            type="number"
                                                            value={data[`drain_hrs_${i}`] || ''}
                                                            onChange={(e) => updateData(`drain_hrs_${i}`, e.target.value)}
                                                            placeholder="Hrs/Week"
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent/40 outline-none transition-all"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <div className="bg-accent/10 border border-accent/20 p-8 rounded-3xl">
                                        <div className="flex justify-between items-center">
                                            <p className="text-sm font-bold uppercase tracking-widest text-accent">Total Potential Weekly Recovery:</p>
                                            <div className="text-4xl font-black italic">
                                                {[1, 2, 3, 4, 5].reduce((acc, i) => acc + (Number(data[`drain_hrs_${i}`]) || 0), 0)} Hrs
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <div className="flex justify-between mt-12">
                                    <button onClick={() => setActiveModule('intro')} className="text-white/40 hover:text-white transition-colors uppercase text-[10px] font-bold tracking-[0.3em]">Back</button>
                                    <button onClick={() => setActiveModule('vision')} className="text-accent hover:underline transition-colors uppercase text-[10px] font-bold tracking-[0.3em] flex items-center gap-2">Next Module <ChevronRight size={12} /></button>
                                </div>
                            </div>
                        )}

                        {activeModule === 'vision' && (
                            <div className="space-y-12 pb-24">
                                <section>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                                            <Target size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold uppercase tracking-tight italic">Worksheet: Vision for My Business</h3>
                                            <p className="text-xs text-white/40 uppercase tracking-widest">Designing the 10+ Hour Recovery</p>
                                        </div>
                                    </div>

                                    <div className="p-8 bg-white/5 border border-white/10 rounded-3xl space-y-8">
                                        <div>
                                            <p className="text-sm font-bold uppercase tracking-widest text-white/60 mb-4 italic text-accent">If AI could save you 10+ hours per week, what would you do with that time?</p>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                {['Strategy and Growth', 'Time with Customers', 'New Products/Services', 'Work-Life Balance'].map((opt) => (
                                                    <div key={opt}
                                                        onClick={() => {
                                                            const current = data.time_usage || []
                                                            const updated = current.includes(opt) ? current.filter((c: any) => c !== opt) : [...current, opt]
                                                            updateData('time_usage', updated)
                                                        }}
                                                        className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${(data.time_usage || []).includes(opt) ? 'bg-accent/10 border-accent/40 text-accent' : 'bg-white/5 border-white/5 text-white/40 hover:border-white/20'
                                                            }`}
                                                    >
                                                        <div className={`w-4 h-4 border-2 border-accent flex items-center justify-center p-[2px] ${(data.time_usage || []).includes(opt) ? 'bg-accent' : ''}`}>
                                                            {(data.time_usage || []).includes(opt) && <div className="w-full h-full bg-black" />}
                                                        </div>
                                                        <span className="text-xs font-bold uppercase tracking-widest">{opt}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/30">12-Month Revenue Goal</label>
                                                <input
                                                    type="text"
                                                    value={data.revenue_goal || ''}
                                                    onChange={(e) => updateData('revenue_goal', e.target.value)}
                                                    placeholder="$0.00"
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent/40 outline-none"
                                                />
                                            </div>
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/30">Team Size Target</label>
                                                <input
                                                    type="text"
                                                    value={data.team_size || ''}
                                                    onChange={(e) => updateData('team_size', e.target.value)}
                                                    placeholder="Current/Future"
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent/40 outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-white/30">Your "Why" for Exploring AI</label>
                                            <textarea
                                                rows={4}
                                                value={data.ai_why || ''}
                                                onChange={(e) => updateData('ai_why', e.target.value)}
                                                placeholder="What is the core driver for this transformation?"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent/40 outline-none resize-none"
                                            />
                                        </div>
                                    </div>
                                </section>

                                <div className="flex justify-between mt-12">
                                    <button onClick={() => setActiveModule('pain-points')} className="text-white/40 hover:text-white transition-colors uppercase text-[10px] font-bold tracking-[0.3em]">Back</button>
                                    <button onClick={() => setActiveModule('literacy')} className="text-accent hover:underline transition-colors uppercase text-[10px] font-bold tracking-[0.3em] flex items-center gap-2">Next Module <ChevronRight size={12} /></button>
                                </div>
                            </div>
                        )}

                        {activeModule === 'literacy' && (
                            <div className="space-y-12 pb-24">
                                <section>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                                            <Lightbulb size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold uppercase tracking-tight italic">Worksheet: AI in My World</h3>
                                            <p className="text-xs text-white/40 uppercase tracking-widest">Recognizing Current AI Interactions</p>
                                        </div>
                                    </div>

                                    <div className="p-8 bg-white/5 border border-white/10 rounded-3xl space-y-8">
                                        <div className="grid md:grid-cols-2 gap-4">
                                            {['Spotify Recommendations', 'Google Maps Routing', 'Netflix Suggestions', 'Email Spam Filtering', 'Fraud Detection', 'Social Media Feeds', 'Voice Assistants', 'Online Shopping'].map((tool) => (
                                                <div key={tool}
                                                    onClick={() => {
                                                        const current = data.existing_ai || []
                                                        const updated = current.includes(tool) ? current.filter((c: any) => c !== tool) : [...current, tool]
                                                        updateData('existing_ai', updated)
                                                    }}
                                                    className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${(data.existing_ai || []).includes(tool) ? 'bg-accent/10 border-accent/40 text-accent' : 'bg-white/5 border-white/5 text-white/40 hover:border-white/20'
                                                        }`}
                                                >
                                                    <span className="text-xs font-bold uppercase tracking-widest">{tool}</span>
                                                    {(data.existing_ai || []).includes(tool) && <CheckCircle2 size={16} />}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-white/30">Reflection: How do these systems help you?</label>
                                            <textarea
                                                rows={3}
                                                value={data.ai_reflection || ''}
                                                onChange={(e) => updateData('ai_reflection', e.target.value)}
                                                placeholder="Convenience vs. efficiency..."
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent/40 outline-none resize-none"
                                            />
                                        </div>
                                    </div>
                                </section>

                                <div className="flex justify-between mt-12">
                                    <button onClick={() => setActiveModule('vision')} className="text-white/40 hover:text-white transition-colors uppercase text-[10px] font-bold tracking-[0.3em]">Back</button>
                                    <button onClick={() => setActiveModule('marketing')} className="text-accent hover:underline transition-colors uppercase text-[10px] font-bold tracking-[0.3em] flex items-center gap-2">Next Module <ChevronRight size={12} /></button>
                                </div>
                            </div>
                        )}

                        {activeModule === 'marketing' && (
                            <div className="space-y-12 pb-24">
                                <section>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                                            <Users size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold uppercase tracking-tight italic">Worksheet: Repetitive Automation</h3>
                                            <p className="text-xs text-white/40 uppercase tracking-widest">Customer Service & Sales Optimization</p>
                                        </div>
                                    </div>

                                    <div className="p-8 bg-white/5 border border-white/10 rounded-3xl space-y-6">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="border-b border-white/5">
                                                        <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-white/30">Common Question</th>
                                                        <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-white/30">Frequency</th>
                                                        <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-white/30">Time to Answer</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {[1, 2, 3, 4, 5].map((i) => (
                                                        <tr key={i}>
                                                            <td className="py-4 pr-4">
                                                                <input
                                                                    value={data[`customer_q_${i}`] || ''}
                                                                    onChange={(e) => updateData(`customer_q_${i}`, e.target.value)}
                                                                    className="w-full bg-transparent border-none focus:outline-none text-sm placeholder:text-white/10"
                                                                    placeholder={`Repetitive Question #${i}`}
                                                                />
                                                            </td>
                                                            <td className="py-4">
                                                                <select
                                                                    value={data[`customer_freq_${i}`] || 'Daily'}
                                                                    onChange={(e) => updateData(`customer_freq_${i}`, e.target.value)}
                                                                    className="bg-transparent text-xs font-bold uppercase outline-none text-accent"
                                                                >
                                                                    <option value="Daily">Daily</option>
                                                                    <option value="Weekly">Weekly</option>
                                                                    <option value="Monthly">Monthly</option>
                                                                </select>
                                                            </td>
                                                            <td className="py-4">
                                                                <input
                                                                    type="number"
                                                                    value={data[`customer_time_${i}`] || ''}
                                                                    onChange={(e) => updateData(`customer_time_${i}`, e.target.value)}
                                                                    className="w-20 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs outline-none"
                                                                    placeholder="Mins"
                                                                />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </section>

                                <div className="flex justify-between mt-12">
                                    <button onClick={() => setActiveModule('literacy')} className="text-white/40 hover:text-white transition-colors uppercase text-[10px] font-bold tracking-[0.3em]">Back</button>
                                    <button onClick={() => setActiveModule('data')} className="text-accent hover:underline transition-colors uppercase text-[10px] font-bold tracking-[0.3em] flex items-center gap-2">Next Module <ChevronRight size={12} /></button>
                                </div>
                            </div>
                        )}

                        {activeModule === 'data' && (
                            <div className="space-y-12 pb-24">
                                <section>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                                            <BarChart3 size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold uppercase tracking-tight italic">Worksheet: Data Readiness Scorecard</h3>
                                            <p className="text-xs text-white/40 uppercase tracking-widest">Assessing Your Foundation</p>
                                        </div>
                                    </div>

                                    <div className="p-8 bg-white/5 border border-white/10 rounded-3xl space-y-8">
                                        <div className="grid gap-6">
                                            {[
                                                { key: 'data_accuracy', label: 'Customer Information Accuracy' },
                                                { key: 'data_format', label: 'Consistent Data Formatting' },
                                                { key: 'data_history', label: 'Complete Transaction Records' },
                                                { key: 'data_accessibility', label: 'Easy to Access Customer History' },
                                                { key: 'data_security', label: 'Regular Backups & Security' },
                                            ].map((item) => (
                                                <div key={item.key} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border border-white/5 rounded-2xl bg-white/[0.02]">
                                                    <span className="text-xs font-bold uppercase tracking-widest text-white/60">{item.label}</span>
                                                    <div className="flex gap-2">
                                                        {[1, 2, 3, 4, 5].map((score) => (
                                                            <button
                                                                key={score}
                                                                onClick={() => updateData(item.key, score)}
                                                                className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${data[item.key] === score ? 'bg-accent text-black scale-110' : 'bg-white/5 text-white/30 hover:bg-white/10'
                                                                    }`}
                                                            >
                                                                {score}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="bg-accent/10 border border-accent/20 p-6 rounded-2xl flex justify-between items-center">
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-accent mb-1">Total Readiness Score</p>
                                                <p className="text-xs text-white/40 uppercase">Max Score: 25</p>
                                            </div>
                                            <div className="text-4xl font-black italic text-accent">
                                                {(Number(data.data_accuracy) || 0) + (Number(data.data_format) || 0) + (Number(data.data_history) || 0) + (Number(data.data_accessibility) || 0) + (Number(data.data_security) || 0)}
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <div className="flex justify-between mt-12">
                                    <button onClick={() => setActiveModule('marketing')} className="text-white/40 hover:text-white transition-colors uppercase text-[10px] font-bold tracking-[0.3em]">Back</button>
                                    <button onClick={() => setActiveModule('pilot')} className="text-accent hover:underline transition-colors uppercase text-[10px] font-bold tracking-[0.3em] flex items-center gap-2">Next Module <ChevronRight size={12} /></button>
                                </div>
                            </div>
                        )}

                        {activeModule === 'pilot' && (
                            <div className="space-y-12 pb-24">
                                <section>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                                            <Rocket size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold uppercase tracking-tight italic">Worksheet: AI Pilot Project Planner</h3>
                                            <p className="text-xs text-white/40 uppercase tracking-widest">Structuring Your First Experiment</p>
                                        </div>
                                    </div>

                                    <div className="p-8 bg-white/5 border border-white/10 rounded-3xl space-y-8">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-accent">The Problem: Describe the specific challenge AI will address</label>
                                            <textarea
                                                rows={3}
                                                value={data.pilot_problem || ''}
                                                onChange={(e) => updateData('pilot_problem', e.target.value)}
                                                placeholder="Ex: Customer support response times lag by 24 hours..."
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent/40 outline-none resize-none"
                                            />
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/30">Primary AI Tool Choice</label>
                                                <input
                                                    type="text"
                                                    value={data.pilot_tool || ''}
                                                    onChange={(e) => updateData('pilot_tool', e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent/40 outline-none"
                                                />
                                            </div>
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/30">Success Metric (KPI)</label>
                                                <input
                                                    type="text"
                                                    value={data.pilot_kpi || ''}
                                                    onChange={(e) => updateData('pilot_kpi', e.target.value)}
                                                    placeholder="Ex: Reduce time by 50%"
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent/40 outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <div className="flex justify-between mt-12">
                                    <button onClick={() => setActiveModule('data')} className="text-white/40 hover:text-white transition-colors uppercase text-[10px] font-bold tracking-[0.3em]">Back</button>
                                    <button onClick={() => setActiveModule('roi')} className="text-accent hover:underline transition-colors uppercase text-[10px] font-bold tracking-[0.3em] flex items-center gap-2">Next Module <ChevronRight size={12} /></button>
                                </div>
                            </div>
                        )}

                        {activeModule === 'roi' && (
                            <div className="space-y-12 pb-24">
                                <section>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                                            <TrendingUp size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold uppercase tracking-tight italic">Worksheet: AI ROI Calculator</h3>
                                            <p className="text-xs text-white/40 uppercase tracking-widest">6-Month Investment Tracking</p>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div className="p-8 bg-white/5 border border-white/10 rounded-3xl space-y-6">
                                            <h4 className="text-xs font-bold uppercase tracking-widest text-accent mb-4">Investment (Costs)</h4>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/30">Software Subs / Monthly</label>
                                                    <input type="number"
                                                        value={data.roi_subs || ''}
                                                        onChange={(e) => updateData('roi_subs', e.target.value)}
                                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 mt-1 text-sm outline-none"
                                                        placeholder="$"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/30">One-time Setup Fees</label>
                                                    <input type="number"
                                                        value={data.roi_setup || ''}
                                                        onChange={(e) => updateData('roi_setup', e.target.value)}
                                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 mt-1 text-sm outline-none"
                                                        placeholder="$"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-8 bg-white/5 border border-white/10 rounded-3xl space-y-6">
                                            <h4 className="text-xs font-bold uppercase tracking-widest text-accent mb-4">Measured Benefits</h4>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/30">Estimated Monthly Value Recovery</label>
                                                    <input type="number"
                                                        value={data.roi_benefit || ''}
                                                        onChange={(e) => updateData('roi_benefit', e.target.value)}
                                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 mt-1 text-sm outline-none"
                                                        placeholder="$"
                                                    />
                                                </div>
                                                <div className="p-4 bg-accent/5 rounded-xl border border-accent/10">
                                                    <p className="text-[10px] font-bold uppercase text-accent/60 mb-2">Calculated 6-Month ROI</p>
                                                    <p className="text-2xl font-black italic">
                                                        {(() => {
                                                            const costs = (Number(data.roi_subs) || 0) * 6 + (Number(data.roi_setup) || 0)
                                                            const benefits = (Number(data.roi_benefit) || 0) * 6
                                                            if (costs === 0) return '0%'
                                                            return Math.round(((benefits - costs) / costs) * 100) + '%'
                                                        })()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <div className="flex justify-between mt-12">
                                    <button onClick={() => setActiveModule('pilot')} className="text-white/40 hover:text-white transition-colors uppercase text-[10px] font-bold tracking-[0.3em]">Back</button>
                                    <button onClick={() => setActiveModule('roadmap')} className="text-accent hover:underline transition-colors uppercase text-[10px] font-bold tracking-[0.3em] flex items-center gap-2">Next Module <ChevronRight size={12} /></button>
                                </div>
                            </div>
                        )}

                        {activeModule === 'roadmap' && (
                            <div className="space-y-12 pb-24">
                                <section>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                                            <TrendingUp size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold uppercase tracking-tight italic">Worksheet: My 1-3-5 Year AI Vision</h3>
                                            <p className="text-xs text-white/40 uppercase tracking-widest">Strategic Implementation Roadmap</p>
                                        </div>
                                    </div>

                                    <div className="p-8 bg-white/5 border border-white/10 rounded-3xl space-y-8">
                                        <div className="grid md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-accent italic">1-Year: Immediate Implementation</label>
                                                <textarea rows={4} value={data.roadmap_1yr || ''} onChange={(e) => updateData('roadmap_1yr', e.target.value)} placeholder="Main focus area..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none resize-none" />
                                            </div>
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">3-Year: Expanded Capabilities</label>
                                                <textarea rows={4} value={data.roadmap_3yr || ''} onChange={(e) => updateData('roadmap_3yr', e.target.value)} placeholder="Advanced integrations..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none resize-none" />
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center text-accent mb-6 animate-bounce">
                                        <CheckCircle2 size={40} />
                                    </div>
                                    <h2 className="text-3xl font-black uppercase italic mb-4">Implementation Plan Complete</h2>
                                    <p className="text-white/40 max-w-md mx-auto mb-8 uppercase text-[10px] font-bold tracking-[0.2em] leading-relaxed">
                                        You have successfully transformed knowledge into a concrete strategy. Your progress is synced and ready for review.
                                    </p>
                                    <button onClick={() => router.push('/dashboard')} className="px-10 py-4 bg-white text-black font-black uppercase tracking-widest hover:bg-accent transition-all rounded-full">Return to Intelligence Portal</button>
                                </div>

                                <div className="flex justify-between mt-12 border-t border-white/5 pt-8">
                                    <button onClick={() => setActiveModule('roi')} className="text-white/40 hover:text-white transition-colors uppercase text-[10px] font-bold tracking-[0.3em]">Back to ROI</button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    )
}
