"use client"

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [isSignUp, setIsSignUp] = useState(false)
    const [mounted, setMounted] = useState(false)

    // Create Supabase client inside component to ensure access to env vars
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        setMounted(true)
    }, [])

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/auth/callback`,
                    }
                })
                if (error) throw error
                setError('Success! Check your email to verify your account.')
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) throw error
                if (error) throw error
                // Force a hard navigation to ensure session is recognized everywhere
                router.refresh()
                window.location.href = '/dashboard'
            }
        } catch (error: any) {
            setError(error.message || 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    if (!mounted) {
        return <div className="min-h-screen bg-black" />
    }

    return (
        <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md z-10"
            >
                <div className="text-center mb-10">
                    <Link href="/" className="inline-flex items-center gap-3 group mb-8">
                        <div className="w-8 h-8 border-2 border-accent rotate-45 flex items-center justify-center transition-transform group-hover:rotate-[135deg] duration-500">
                            <div className="w-4 h-4 bg-accent -rotate-45" />
                        </div>
                        <div className="flex flex-col leading-none text-left">
                            <span className="text-xl font-black tracking-tighter uppercase">Avant-Garde</span>
                            <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-white/40">Enterprise</span>
                        </div>
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tighter uppercase mb-2">Access Portal</h1>
                    <p className="text-white/50 text-sm uppercase tracking-[0.1em]">Secure Environment // Client Access</p>
                </div>

                <div className="bg-white/5 p-8 rounded-2xl border border-white/10 backdrop-blur-sm shadow-2xl">
                    <form onSubmit={handleAuth} className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-colors"
                                placeholder="your@email.com"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-colors"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <div className={`p-3 rounded-lg text-sm ${error.includes('Success')
                                ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                                : 'bg-red-500/10 border border-red-500/20 text-red-400'
                                }`}>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-white text-black font-bold uppercase tracking-widest py-3 rounded-lg hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setIsSignUp(!isSignUp)
                                setError('')
                            }}
                            className="w-full text-white/50 hover:text-accent text-sm font-bold uppercase tracking-widest transition-colors"
                        >
                            {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
                        </button>
                    </form>
                </div>

                <div className="mt-8 text-center">
                    <Link
                        href="/"
                        className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 hover:text-accent transition-colors"
                    >
                        ← Return to Interface
                    </Link>
                </div>
            </motion.div>
        </main>
    )
}
