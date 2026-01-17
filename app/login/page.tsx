"use client"

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/lib/supabaseClient'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function LoginPage() {
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
                    <Auth
                        supabaseClient={supabase}
                        appearance={{
                            theme: ThemeSupa,
                            variables: {
                                default: {
                                    colors: {
                                        brand: '#FFFFFF',
                                        brandAccent: '#FFFFFF',
                                        inputBackground: 'rgba(255, 255, 255, 0.05)',
                                        inputBorder: 'rgba(255, 255, 255, 0.1)',
                                        inputText: 'white',
                                        inputPlaceholder: 'rgba(255, 255, 255, 0.3)',
                                    }
                                }
                            },
                            className: {
                                container: 'auth-container',
                                button: 'auth-button',
                                input: 'auth-input',
                            }
                        }}
                        theme="dark"
                        providers={[]}
                        redirectTo={`${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard`}
                    />
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

            <style jsx global>{`
                .auth-container {
                    font-family: inherit;
                }
                .auth-button {
                    border-radius: 8px !important;
                    text-transform: uppercase !important;
                    font-weight: 800 !important;
                    letter-spacing: 0.1em !important;
                    padding: 12px !important;
                    background: white !important;
                    color: black !important;
                    transition: all 0.2s ease !important;
                }
                .auth-button:hover {
                    background: #f0f0f0 !important;
                    transform: translateY(-1px);
                }
                .auth-input {
                    border-radius: 8px !important;
                    background: rgba(255, 255, 255, 0.05) !important;
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                    color: white !important;
                    padding: 12px !important;
                }
                .auth-input:focus {
                    border-color: rgba(255, 255, 255, 0.3) !important;
                }
                .supabase-account-link {
                    color: rgba(255, 255, 255, 0.5) !important;
                    font-size: 12px !important;
                }
                .supabase-account-link:hover {
                    color: white !important;
                }
            `}</style>
        </main>
    )
}
