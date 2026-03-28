"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Navbar } from "@/components/Navbar"
import { motion } from "framer-motion"
import { Activity, Calendar, Play, Plus, Target, Scale, CheckCircle2 } from "lucide-react"

export default function TaiChiDashboard() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const [activePlan, setActivePlan] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [weightInput, setWeightInput] = useState("")

    // Visual Generation State
    const [activeExercise, setActiveExercise] = useState<any>(null)
    const [visualLoading, setVisualLoading] = useState(false)
    const [visualUrl, setVisualUrl] = useState<string | null>(null)

    useEffect(() => {
        checkUserAndProfile()
    }, [])

    const checkUserAndProfile = async () => {
        try {
            const { data: { user: currentUser } } = await supabase.auth.getUser()
            if (!currentUser) {
                router.push('/login')
                return
            }
            setUser(currentUser)

            const { data: userProfile } = await supabase
                .from('tai_chi_profiles')
                .select('*')
                .eq('user_id', currentUser.id)
                .maybeSingle()

            if (!userProfile) {
                router.push('/tools/tai-chi/onboarding')
                return
            }
            setProfile(userProfile)

            const { data: plan } = await supabase
                .from('tai_chi_plans')
                .select('*')
                .eq('user_id', currentUser.id)
                .eq('is_active', true)
                .maybeSingle()

            setActivePlan(plan)
        } catch (e) {
            console.error("Error loading Tai Chi data:", e)
        } finally {
            setLoading(false)
        }
    }

    const generatePlan = async () => {
        setGenerating(true)
        try {
            // Call our AI plan generation endpoint
            const res = await fetch('/api/tai-chi/generate-plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profile })
            })

            if (!res.ok) throw new Error("Failed to generate plan")

            // Reload the page or state
            await checkUserAndProfile()
        } catch (e) {
            console.error(e)
            alert("Error generating the AI Plan. Check console.")
        } finally {
            setGenerating(false)
        }
    }

    const logProgress = async () => {
        if (!activePlan) return

        try {
            await supabase.from('tai_chi_progress').insert({
                user_id: user.id,
                plan_id: activePlan.id,
                weight_entry: weightInput ? parseFloat(weightInput) : null,
                duration_minutes: profile.daily_time_commitment,
                completed_exercises: activePlan.plan_data?.daily_routine || []
            })
            alert("Progress logged successfully!")
            setWeightInput("")
        } catch (e) {
            console.error(e)
            alert("Failed to log progress")
        }
    }

    const generateVisual = async (exercise: any) => {
        setActiveExercise(exercise)
        setVisualUrl(null)
        setVisualLoading(true)

        try {
            const res = await fetch('/api/tai-chi/generate-visuals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    exerciseName: exercise.name,
                    exerciseDescription: exercise.description
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to generate visual")

            setVisualUrl(data.imageUrl)
        } catch (e) {
            console.error(e)
            alert("Error generating the visual instruction. Check console.")
        } finally {
            setVisualLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent animate-spin rounded-full" />
            </div>
        )
    }

    return (
        <main className="min-h-screen bg-black text-white">
            <Navbar />
            <div className="pt-32 pb-24 px-6 md:px-12 max-w-7xl mx-auto">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2">
                            Tai Chi <span className="text-accent">Protocol</span>
                        </h1>
                        <p className="text-white/40 text-sm uppercase tracking-widest font-bold">
                            Strategic Alignment Center // Active
                        </p>
                    </div>
                    {activePlan && (
                        <button onClick={logProgress} className="px-6 py-3 bg-accent text-black font-black uppercase tracking-widest text-xs hover:bg-white transition-colors flex items-center gap-2">
                            <CheckCircle2 size={16} /> Log Today's Session
                        </button>
                    )}
                </div>

                {!activePlan ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
                        <Activity size={48} className="text-accent mx-auto mb-6" />
                        <h2 className="text-2xl font-black uppercase tracking-widest mb-4">Profile Calibrated</h2>
                        <p className="text-white/60 mb-8 max-w-xl mx-auto">
                            Your medical constraints, physical baselines, and 12-month goals have been registered. The AI is ready to synthesize your adaptive Tai Chi protocol.
                        </p>
                        <button
                            onClick={generatePlan}
                            disabled={generating}
                            className="px-8 py-4 bg-white text-black font-black uppercase tracking-widest text-sm hover:bg-accent transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                        >
                            {generating ? "Synthesizing..." : "Generate AI Protocol"}
                        </button>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Routine Column */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
                                        <Play className="text-accent fill-accent" size={20} /> Today's Routine
                                    </h3>
                                    <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">
                                        {profile.sessions_per_day}x {profile.daily_time_commitment} Min Sessions
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    {(activePlan.plan_data?.daily_routine || []).map((exercise: any, i: number) => (
                                        <div
                                            key={i}
                                            onClick={() => generateVisual(exercise)}
                                            className="p-4 bg-black/50 border border-white/5 rounded-xl flex items-start justify-between group cursor-pointer hover:border-accent/30 transition-colors"
                                        >
                                            <div>
                                                <h4 className="font-bold mb-1 group-hover:text-accent transition-colors">{exercise.name}</h4>
                                                <p className="text-white/40 text-sm line-clamp-2">{exercise.description}</p>
                                            </div>
                                            <div className="text-right ml-4 shrink-0">
                                                <span className="text-accent text-[10px] font-black uppercase tracking-widest block mb-1">View</span>
                                            </div>
                                        </div>
                                    ))}
                                    {(!activePlan.plan_data?.daily_routine || activePlan.plan_data.daily_routine.length === 0) && (
                                        <p className="text-white/40 italic">Routine loading...</p>
                                    )}
                                </div>
                            </div>

                            {/* Viewer Interface */}
                            {activeExercise && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 border border-white/10 rounded-2xl p-8">
                                    <h3 className="text-xl font-black uppercase tracking-widest mb-4">
                                        {activeExercise.name}
                                    </h3>
                                    <p className="text-white/60 mb-6">{activeExercise.description}</p>

                                    <div className="w-full aspect-square bg-black/50 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden">
                                        {visualLoading ? (
                                            <div className="text-center">
                                                <div className="w-8 h-8 border-2 border-accent border-t-transparent animate-spin rounded-full mx-auto mb-4" />
                                                <p className="text-accent text-[10px] font-black uppercase tracking-widest animate-pulse mt-4">
                                                    AI Synthesizing Video Data... (up to 60s)
                                                </p>
                                            </div>
                                        ) : visualUrl ? (
                                            <video src={visualUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                                        ) : (
                                            <p className="text-white/40 text-[10px] uppercase tracking-widest">
                                                Visual data not available
                                            </p>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-8">
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <Target className="text-accent" size={16} /> Current Horizon
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">1-Month Goal</p>
                                        <p className="text-sm">{profile.goal_1_month}</p>
                                    </div>
                                    <div>
                                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">6-Month Goal</p>
                                        <p className="text-sm border-l-2 border-white/10 pl-3">{profile.goal_6_month}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <Scale className="text-accent" size={16} /> Biometrics Log
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-2 block">Today's Weight (lbs)</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                value={weightInput}
                                                onChange={(e) => setWeightInput(e.target.value)}
                                                className="bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white w-full focus:border-accent focus:outline-none transition-colors"
                                                placeholder="e.g. 180.5"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    )
}
