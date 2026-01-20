"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Mail, Sparkles, ChevronRight, Gift } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

export function NewsletterPopup() {
    const [isVisible, setIsVisible] = useState(false)
    const [email, setEmail] = useState("")
    const [name, setName] = useState("")
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

    useEffect(() => {
        const checkAuthAndShow = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            const hasJoined = localStorage.getItem("newsletter_joined")
            const hasDismissed = localStorage.getItem("newsletter_dismissed")

            // Only show if: not logged in AND hasn't joined AND hasn't dismissed
            if (!session && !hasJoined && !hasDismissed) {
                const timer = setTimeout(() => {
                    setIsVisible(true)
                }, 5000)
                return () => clearTimeout(timer)
            }
        }

        checkAuthAndShow()
    }, [])

    const handleDismiss = () => {
        setIsVisible(false)
        localStorage.setItem("newsletter_dismissed", "true")
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setStatus('loading')

        try {
            const { error } = await supabase
                .from('subscribers')
                .insert([{
                    email,
                    first_name: name,
                    received_workbook: false
                }])

            if (error) {
                if (error.code === '23505') { // Unique violation
                    setStatus('success') // User already exists, just show success
                } else {
                    throw error
                }
            } else {
                setStatus('success')
            }

            localStorage.setItem("newsletter_joined", "true")
            setTimeout(() => setIsVisible(false), 3000)
        } catch (error) {
            console.error(error)
            setStatus('error')
        }
    }

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleDismiss}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-xl bg-[#0a0a0a] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
                    >
                        {/* Premium Gradient Background */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent" />
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent/20 rounded-full blur-[100px]" />
                        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px]" />

                        <button
                            onClick={handleDismiss}
                            className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>

                        <div className="p-8 md:p-12">
                            {status === 'success' ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-12"
                                >
                                    <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6 text-accent">
                                        <Sparkles size={40} />
                                    </div>
                                    <h2 className="text-3xl font-black uppercase tracking-tighter mb-4 italic italic">Welcome to the Vanguard</h2>
                                    <p className="text-white/60 mb-8 max-w-sm mx-auto uppercase text-[10px] font-bold tracking-[0.2em] leading-relaxed">
                                        You are now on the list. Access your Interactive Workbook by creating a secure portal account.
                                    </p>
                                    <a
                                        href="/login"
                                        className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-black uppercase tracking-widest hover:bg-accent transition-all text-sm"
                                    >
                                        Claim Your Workbook <ChevronRight size={18} />
                                    </a>
                                </motion.div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="px-3 py-1 bg-accent/10 border border-accent/20 rounded-full text-accent text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                            <Gift size={12} /> Free Resource
                                        </div>
                                    </div>

                                    <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4 leading-[0.9] italic">
                                        Unlock the <span className="text-accent underline decoration-white/10">AI Advantage Plan</span>
                                    </h2>

                                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em] mb-10 leading-relaxed max-w-md">
                                        Join our intelligence list and get instant access to the Interactive Implementation Workbook used by elite small businesses.
                                    </p>

                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-2">First Name</label>
                                                <input
                                                    required
                                                    type="text"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    placeholder="Alex"
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-accent/40 outline-none transition-all placeholder:text-white/10"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-2">Email Address</label>
                                                <input
                                                    required
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder="alex@enterprise.com"
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-accent/40 outline-none transition-all placeholder:text-white/10"
                                                />
                                            </div>
                                        </div>

                                        <button
                                            disabled={status === 'loading'}
                                            type="submit"
                                            className="w-full bg-accent text-black p-5 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3 text-sm mt-4"
                                        >
                                            {status === 'loading' ? (
                                                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <>Get Instant Access <ChevronRight size={20} /></>
                                            )}
                                        </button>

                                        <p className="text-center text-[9px] text-white/20 uppercase tracking-widest mt-6">
                                            No Spam // High Signal Only // Secure Encryption
                                        </p>
                                    </form>
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
