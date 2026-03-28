"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { motion } from "framer-motion"
import { ArrowRight, CheckCircle2, ShieldAlert, Activity, Clock, Target } from "lucide-react"

export default function TaiChiOnboarding() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const [formData, setFormData] = useState({
        medicalConditions: [] as string[],
        otherMedical: "",
        physicalAbilities: "",
        dailyTime: "15",
        sessionsPerDay: "1",
        goal1m: "",
        goal2m: "",
        goal6m: "",
        goal1y: "",
    })

    const commonConditions = [
        "Arthritis", "Hypertension", "Back Pain", "Knee Issues",
        "Balance Issues", "Osteoporosis", "Peripheral Neuropathy"
    ]

    const handleConditionToggle = (condition: string) => {
        setFormData(prev => ({
            ...prev,
            medicalConditions: prev.medicalConditions.includes(condition)
                ? prev.medicalConditions.filter(c => c !== condition)
                : [...prev.medicalConditions, condition]
        }))
    }

    const handleSubmit = async () => {
        setLoading(true)
        setError("")

        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/login')
                return
            }

            const allConditions = [...formData.medicalConditions]
            if (formData.otherMedical) {
                allConditions.push(formData.otherMedical)
            }

            const profileData = {
                user_id: user.id,
                medical_conditions: allConditions,
                physical_abilities: formData.physicalAbilities,
                daily_time_commitment: parseInt(formData.dailyTime),
                sessions_per_day: parseInt(formData.sessionsPerDay),
                goal_1_month: formData.goal1m,
                goal_2_month: formData.goal2m,
                goal_6_month: formData.goal6m,
                goal_1_year: formData.goal1y,
            }

            const { error: dbError } = await supabase
                .from('tai_chi_profiles')
                .upsert(profileData)

            if (dbError) throw dbError

            router.push('/tools/tai-chi')
        } catch (e: any) {
            console.error("Error saving onboarding:", e)
            setError(e.message || "Failed to save profile. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center">
            <div className="max-w-3xl w-full">
                {/* Header */}
                <div className="mb-12 text-center">
                    <h1 className="text-4xl font-black uppercase tracking-tighter mb-4">
                        Strategic <span className="text-accent">Alignment</span>
                    </h1>
                    <p className="text-white/60 text-sm uppercase tracking-widest">
                        Tai Chi Performance Calibration // Step {step} of 4
                    </p>
                </div>

                {error && (
                    <div className="bg-red-900/20 border border-red-500/50 text-red-500 p-4 rounded-xl mb-8 flex items-center gap-3">
                        <ShieldAlert size={20} />
                        <span className="text-sm font-bold uppercase">{error}</span>
                    </div>
                )}

                {/* Form Container */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                    {/* STEP 1: Medical Constraints */}
                    {step === 1 && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <div className="flex items-center gap-3 mb-6">
                                <ShieldAlert className="text-accent" />
                                <h2 className="text-xl font-bold uppercase tracking-widest">Medical Parameters</h2>
                            </div>
                            <p className="text-white/60 text-sm mb-6">Select any current conditions so the AI can safely adapt your protocol.</p>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                                {commonConditions.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => handleConditionToggle(c)}
                                        className={`p-3 rounded-lg border text-sm font-bold transition-all ${formData.medicalConditions.includes(c)
                                            ? 'bg-accent/20 border-accent/50 text-accent'
                                            : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30'
                                            }`}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>

                            <div className="mb-8">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Other Conditions (Optional)</label>
                                <input
                                    type="text"
                                    value={formData.otherMedical}
                                    onChange={e => setFormData({ ...formData, otherMedical: e.target.value })}
                                    placeholder="e.g., Recovering from shoulder surgery"
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/20 focus:border-accent focus:outline-none transition-colors"
                                />
                            </div>

                            <button onClick={() => setStep(2)} className="w-full py-4 bg-white text-black font-black uppercase tracking-widest text-sm hover:bg-accent transition-colors flex items-center justify-center gap-2">
                                Confirm & Proceed <ArrowRight size={16} />
                            </button>
                        </motion.div>
                    )}

                    {/* STEP 2: Physical Abilities & Time */}
                    {step === 2 && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <div className="flex items-center gap-3 mb-6">
                                <Activity className="text-accent" />
                                <h2 className="text-xl font-bold uppercase tracking-widest">Current Baseline</h2>
                            </div>

                            <div className="mb-8">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Physical Abilities & Limitations</label>
                                <textarea
                                    value={formData.physicalAbilities}
                                    onChange={e => setFormData({ ...formData, physicalAbilities: e.target.value })}
                                    placeholder="Briefly describe your current fitness level, flexibility, and any specific movement constraints."
                                    className="w-full h-32 bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/20 focus:border-accent focus:outline-none transition-colors resize-none mb-2"
                                />
                            </div>

                            <div className="flex items-center gap-3 mb-6">
                                <Clock className="text-accent" />
                                <h2 className="text-xl font-bold uppercase tracking-widest">Daily Investment</h2>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Duration Per Session</label>
                                    <select
                                        value={formData.dailyTime}
                                        onChange={e => setFormData({ ...formData, dailyTime: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-accent focus:outline-none transition-colors appearance-none"
                                    >
                                        <option value="10">10 Minutes (Minimal)</option>
                                        <option value="15">15 Minutes (Standard)</option>
                                        <option value="30">30 Minutes (Growth)</option>
                                        <option value="45">45 Minutes (Dedicated)</option>
                                        <option value="60">60 Minutes (Intensive)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Sessions Per Day</label>
                                    <select
                                        value={formData.sessionsPerDay}
                                        onChange={e => setFormData({ ...formData, sessionsPerDay: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-accent focus:outline-none transition-colors appearance-none"
                                    >
                                        <option value="1">1 Session</option>
                                        <option value="2">2 Sessions</option>
                                        <option value="3">3 Sessions</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button onClick={() => setStep(1)} className="w-1/3 py-4 border border-white/20 text-white font-black uppercase tracking-widest text-sm hover:bg-white/10 transition-colors">
                                    Back
                                </button>
                                <button onClick={() => setStep(3)} className="w-2/3 py-4 bg-white text-black font-black uppercase tracking-widest text-sm hover:bg-accent transition-colors flex items-center justify-center gap-2">
                                    Continue <ArrowRight size={16} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 3: Short-Term Goals */}
                    {step === 3 && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <div className="flex items-center gap-3 mb-6">
                                <Target className="text-accent" />
                                <h2 className="text-xl font-bold uppercase tracking-widest">Immediate Objectives</h2>
                            </div>

                            <div className="mb-6">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">1-Month Goal</label>
                                <input
                                    type="text"
                                    value={formData.goal1m}
                                    onChange={e => setFormData({ ...formData, goal1m: e.target.value })}
                                    placeholder="e.g., Establish a consistent routine, learn 3 basic stances."
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/20 focus:border-accent focus:outline-none transition-colors"
                                />
                            </div>

                            <div className="mb-8">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">2-Month Goal</label>
                                <input
                                    type="text"
                                    value={formData.goal2m}
                                    onChange={e => setFormData({ ...formData, goal2m: e.target.value })}
                                    placeholder="e.g., Noticeable reduction in back pain, increased flexibility."
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/20 focus:border-accent focus:outline-none transition-colors"
                                />
                            </div>

                            <div className="flex gap-4">
                                <button onClick={() => setStep(2)} className="w-1/3 py-4 border border-white/20 text-white font-black uppercase tracking-widest text-sm hover:bg-white/10 transition-colors">
                                    Back
                                </button>
                                <button onClick={() => setStep(4)} className="w-2/3 py-4 bg-white text-black font-black uppercase tracking-widest text-sm hover:bg-accent transition-colors flex items-center justify-center gap-2">
                                    Final Phase <ArrowRight size={16} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 4: Long-Term Goals */}
                    {step === 4 && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <div className="flex items-center gap-3 mb-6">
                                <Target className="text-accent" />
                                <h2 className="text-xl font-bold uppercase tracking-widest">Strategic Vision</h2>
                            </div>

                            <div className="mb-6">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">6-Month Goal</label>
                                <input
                                    type="text"
                                    value={formData.goal6m}
                                    onChange={e => setFormData({ ...formData, goal6m: e.target.value })}
                                    placeholder="e.g., Perform a full short-form routine fluidly."
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/20 focus:border-accent focus:outline-none transition-colors"
                                />
                            </div>

                            <div className="mb-8">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">1-Year Goal</label>
                                <input
                                    type="text"
                                    value={formData.goal1y}
                                    onChange={e => setFormData({ ...formData, goal1y: e.target.value })}
                                    placeholder="e.g., Significantly improved balance, reduced stress markers."
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/20 focus:border-accent focus:outline-none transition-colors"
                                />
                            </div>

                            <div className="flex gap-4">
                                <button disabled={loading} onClick={() => setStep(3)} className="w-1/3 py-4 border border-white/20 text-white font-black uppercase tracking-widest text-sm hover:bg-white/10 transition-colors disabled:opacity-50">
                                    Back
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="w-2/3 py-4 bg-accent text-black font-black uppercase tracking-widest text-sm hover:bg-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? "Initializing Protocol..." : "Generate AI Protocol"}
                                    {!loading && <CheckCircle2 size={16} />}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    )
}
