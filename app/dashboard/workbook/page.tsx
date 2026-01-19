"use client"

import { useState, useEffect } from "react"
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

                        {/* Placeholder for other modules */}
                        {activeModule !== 'intro' && activeModule !== 'pain-points' && (
                            <div className="min-h-[40vh] border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center gap-4 text-center p-12">
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-white/20">
                                    <LayoutDashboard size={32} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold uppercase tracking-tighter mb-2 italic">Module Under Construction</h3>
                                    <p className="text-white/40 text-sm max-w-sm">I am currently building out the interactive components for {modules.find(m => m.id === activeModule)?.title}. Your data will still be synced.</p>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    )
}
