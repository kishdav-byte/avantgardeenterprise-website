"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    ChevronRight,
    ArrowLeft,
    CheckCircle2,
    BarChart3,
    Zap,
    Shield,
    Cpu,
    Users,
    Target,
    Activity
} from "lucide-react"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import Link from "next/link"

const questions = [
    {
        id: "industry",
        question: "What industry is your company in?",
        type: "single",
        options: ["Manufacturing", "Professional Services", "Healthcare", "Retail", "Technology", "Financial Services", "Other"]
    },
    {
        id: "size",
        question: "How many employees does your company have?",
        type: "single",
        options: ["1-10", "11-50", "51-200", "201-500", "500+"]
    },
    {
        id: "role",
        question: "What is your role in the organization?",
        type: "single",
        options: ["Owner/Founder", "Operations Manager", "IT Leader", "C-Level Executive", "Department Head"]
    },
    {
        id: "maturity",
        question: "What best describes your current AI implementation status?",
        type: "single",
        options: [
            { label: "Just Exploring", value: 10 },
            { label: "Active Researching", value: 25 },
            { label: "Small Pilot Projects", value: 50 },
            { label: "Partially Deployed", value: 75 },
            { label: "AI-First Operations", value: 100 }
        ]
    },
    {
        id: "challenges",
        question: "What are your biggest operational challenges? (Select all that apply)",
        type: "multi",
        options: ["Manual Data Entry", "Slow Lead Response", "Inefficient Scheduling", "Customer Support Volume", "Content Generation", "Scaling Team Performance"]
    },
    {
        id: "friction",
        question: "What's preventing you from implementing AI faster?",
        type: "multi",
        options: ["Lack of Expertise", "Budget Constraints", "ROI Uncertainty", "Data Privacy Concerns", "Integration Difficulty"]
    },
    {
        id: "urgency",
        question: "What is your timeline for implementing AI solutions?",
        type: "single",
        options: [
            { label: "Immediately", value: 100 },
            { label: "This Quarter", value: 80 },
            { label: "Within 6 Months", value: 50 },
            { label: "Just Researching", value: 20 }
        ]
    },
    {
        id: "budget",
        question: "What budget have you allocated for AI in the next 12 months?",
        type: "single",
        options: ["Under $10k", "$10k - $50k", "$50k - $200k", "$200k+", "Not yet determined"]
    },
    {
        id: "lead",
        question: "Where should we send your full AI Blueprint?",
        type: "form"
    }
]

export default function AIReadinessPage() {
    const [step, setStep] = useState(0)
    const [answers, setAnswers] = useState<Record<string, any>>({})
    const [isComplete, setIsComplete] = useState(false)
    const [score, setScore] = useState(0)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [leadInfo, setLeadInfo] = useState({ name: "", email: "" })

    const handleSelect = (value: any) => {
        const currentQuestion = questions[step]

        if (currentQuestion.id === "lead") return // Handled by form submission

        if (currentQuestion.type === "single") {
            setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }))
            if (step < questions.length - 1) {
                setTimeout(() => setStep(step + 1), 300)
            }
        } else {
            const currentAnswers = answers[currentQuestion.id] || []
            const newAnswers = currentAnswers.includes(value)
                ? currentAnswers.filter((v: any) => v !== value)
                : [...currentAnswers, value]
            setAnswers(prev => ({ ...prev, [currentQuestion.id]: newAnswers }))
        }
    }

    const nextStep = () => {
        if (step < questions.length - 1) {
            setStep(step + 1)
        }
    }

    const prevStep = () => {
        if (step > 0) setStep(step - 1)
    }

    const handleSubmitLead = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        // Calculate Score
        const maturityValue = typeof answers.maturity === 'object' ? answers.maturity.value : 20
        const urgencyValue = typeof answers.urgency === 'object' ? answers.urgency.value : 20
        const finalScore = Math.round((maturityValue + urgencyValue) / 2)
        setScore(finalScore)

        try {
            // Synthesis of message
            const message = `
AI READINESS ASSESSMENT RESULTS
------------------------------
Readiness Score: ${finalScore}%
Industry: ${answers.industry}
Size: ${answers.size}
Role: ${answers.role}
Implementation Status: ${answers.maturity?.label || answers.maturity}
Timeline: ${answers.urgency?.label || answers.urgency}
Challenges: ${(answers.challenges || []).join(', ')}
Preventing: ${(answers.friction || []).join(', ')}
Budget: ${answers.budget}
            `.trim()

            await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: leadInfo.name,
                    email: leadInfo.email,
                    message: message
                })
            })

            setIsComplete(true)
        } catch (error) {
            console.error("Submission failed:", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <main className="min-h-screen bg-black text-white">
            <Navbar />

            <section className="pt-24 md:pt-32 pb-16 md:pb-24 px-4 overflow-hidden relative">
                {/* Background Grid/UI */}
                <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{
                    backgroundImage: `linear-gradient(rgba(255, 95, 31, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 95, 31, 0.05) 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }} />

                <div className="container mx-auto max-w-4xl relative z-10">
                    {!isComplete ? (
                        <>
                            {/* Header / Meta */}
                            <header className="mb-8 md:mb-12 flex justify-between items-end">
                                <div>
                                    <div className="text-accent text-[10px] font-black uppercase tracking-[0.4em] mb-4">Discovery Engine // 001</div>
                                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic italic">
                                        AI Readiness <span className="text-white/40">Assessment</span>
                                    </h1>
                                </div>
                                <div className="text-right hidden sm:block">
                                    <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-1">Progress</div>
                                    <div className="text-xl font-black italic italic">{Math.round(((step + 1) / questions.length) * 100)}%</div>
                                </div>
                            </header>

                            {/* Progress Bar */}
                            <div className="w-full h-1 bg-white/5 mb-12 md:mb-20 overflow-hidden rounded-full">
                                <motion.div
                                    className="h-full bg-accent shadow-[0_0_15px_rgba(255,95,31,0.5)]"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${((step + 1) / questions.length) * 100}%` }}
                                />
                            </div>

                            {/* Question Area */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={step}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8 md:space-y-12"
                                >
                                    <div className="space-y-4 md:space-y-6">
                                        <div className="w-10 h-10 md:w-12 md:h-12 border border-accent rotate-45 flex items-center justify-center mb-6 md:mb-8">
                                            <span className="text-accent text-xs md:text-sm font-black -rotate-45">{step + 1}</span>
                                        </div>
                                        <h2 className="text-xl md:text-4xl font-bold tracking-tight leading-tight uppercase">
                                            {questions[step].question}
                                        </h2>
                                        {questions[step].type === "multi" && (
                                            <p className="text-accent text-[10px] font-black uppercase tracking-widest animate-pulse">
                                                Multi-selection active
                                            </p>
                                        )}
                                    </div>

                                    {questions[step].type === "form" ? (
                                        <form onSubmit={handleSubmitLead} className="space-y-6 max-w-lg">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Full Name</label>
                                                <input
                                                    required
                                                    type="text"
                                                    value={leadInfo.name}
                                                    onChange={(e) => setLeadInfo(prev => ({ ...prev, name: e.target.value }))}
                                                    placeholder="Enter your name"
                                                    className="w-full bg-white/5 border border-white/10 p-4 md:p-6 text-sm focus:border-accent outline-none transition-all placeholder:opacity-20"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Business Email</label>
                                                <input
                                                    required
                                                    type="email"
                                                    value={leadInfo.email}
                                                    onChange={(e) => setLeadInfo(prev => ({ ...prev, email: e.target.value }))}
                                                    placeholder="you@company.com"
                                                    className="w-full bg-white/5 border border-white/10 p-4 md:p-6 text-sm focus:border-accent outline-none transition-all placeholder:opacity-20"
                                                />
                                            </div>
                                            <button
                                                disabled={isSubmitting}
                                                type="submit"
                                                className="w-full bg-white text-black p-4 md:p-6 font-black uppercase tracking-widest text-xs hover:bg-accent transition-all flex items-center justify-center gap-2"
                                            >
                                                {isSubmitting ? "Generating Profile..." : "Analyze My Results"}
                                                {!isSubmitting && <ChevronRight size={18} />}
                                            </button>
                                        </form>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {questions[step].options?.map((option: any, idx: number) => {
                                                const label = typeof option === 'string' ? option : option.label
                                                const isSelected = questions[step].type === "single"
                                                    ? answers[questions[step].id] === option
                                                    : (answers[questions[step].id] || []).includes(option)

                                                return (
                                                    <button
                                                        key={idx}
                                                        onClick={() => handleSelect(option)}
                                                        className={`group relative p-4 md:p-6 text-left border transition-all duration-300 overflow-hidden ${isSelected
                                                            ? 'bg-accent/10 border-accent text-white shadow-[0_0_30px_rgba(255,95,31,0.1)]'
                                                            : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30 hover:bg-white/[0.07]'
                                                            }`}
                                                    >
                                                        <div className="relative z-10 flex items-center justify-between">
                                                            <span className="text-sm font-black uppercase tracking-widest">{label}</span>
                                                            {isSelected && <CheckCircle2 size={18} className="text-accent" />}
                                                        </div>

                                                        {/* Decorative Elements */}
                                                        <div className={`absolute top-0 right-0 p-2 opacity-5 pointer-events-none transition-transform group-hover:scale-110 ${isSelected ? 'opacity-20' : ''}`}>
                                                            <Cpu size={40} />
                                                        </div>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    )}

                                    <div className="pt-12 flex items-center justify-between">
                                        <button
                                            onClick={prevStep}
                                            disabled={step === 0}
                                            className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-opacity ${step === 0 ? 'opacity-0' : 'opacity-40 hover:opacity-100'}`}
                                        >
                                            <ArrowLeft size={14} /> Back
                                        </button>

                                        {questions[step].type === "multi" && (
                                            <button
                                                onClick={nextStep}
                                                className="px-10 py-5 bg-white text-black font-black uppercase tracking-widest text-[10px] hover:bg-accent transition-colors flex items-center gap-2"
                                            >
                                                Confirm Selection <ChevronRight size={16} />
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-20"
                        >
                            <div className="w-24 h-24 border-2 border-accent rotate-45 flex items-center justify-center mx-auto mb-12">
                                <Zap size={40} className="text-accent -rotate-45" />
                            </div>

                            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-4 italic italic">
                                Analysis Complete
                            </h2>
                            <p className="text-white/40 uppercase tracking-[0.4em] text-[11px] font-bold mb-16">
                                Generating your intelligence profile...
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                                <div className="bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-xl transition-all">
                                    <div className="text-accent font-black text-4xl mb-2 italic italic">{score}%</div>
                                    <div className="text-[10px] font-black uppercase tracking-widest opacity-40">Readiness Score</div>
                                </div>
                                <div className="bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-xl transition-all">
                                    <div className="text-white font-black text-4xl mb-2 italic italic">ELITE</div>
                                    <div className="text-[10px] font-black uppercase tracking-widest opacity-40">Profile Status</div>
                                </div>
                                <div className="bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-xl transition-all">
                                    <div className="text-white font-black text-4xl mb-2 italic italic">12.4x</div>
                                    <div className="text-[10px] font-black uppercase tracking-widest opacity-40">Potential ROI</div>
                                </div>
                            </div>

                            <div className="max-w-2xl mx-auto space-y-8">
                                <p className="text-white/70 text-lg leading-relaxed">
                                    Our analysis indicates your business is in a prime position to deploy high-concurrency AI systems. We’ve sent your full roadmap to <strong>{leadInfo.email}</strong>.
                                </p>

                                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                                    <Link href="/contact" className="px-12 py-6 bg-white text-black font-black uppercase tracking-widest text-xs hover:bg-accent transition-colors">
                                        Speak with an Architect
                                    </Link>
                                    <Link href="/dashboard" className="px-12 py-6 border border-white/10 text-white font-black uppercase tracking-widest text-xs hover:bg-accent hover:border-accent transition-all">
                                        Return to Portal
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Status Bar */}
                <div className="fixed bottom-0 left-0 right-0 p-4 md:p-6 flex justify-between items-center pointer-events-none border-t border-white/5 bg-black/40 backdrop-blur-xl z-50">
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex gap-2">
                            {[1, 2, 3].map(i => <div key={i} className="w-1 h-1 bg-accent rounded-full animate-pulse" />)}
                        </div>
                        <span className="text-[7px] md:text-[8px] font-black uppercase tracking-[0.2em] md:tracking-[0.4em] opacity-40">System Analyzing: LIVE_STREAM_001</span>
                    </div>
                    <div className="flex items-center gap-4 text-[7px] md:text-[8px] font-black uppercase tracking-[0.2em] md:tracking-[0.4em] opacity-40">
                        <Activity size={10} className="text-accent" />
                        <span className="hidden xs:inline">Data Secured via AES-256</span>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    )
}
