"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Loader2, Lock } from 'lucide-react'
import Link from 'next/link'
import PawgressApp from '@/components/k9/PawgressApp'

export default function PawgressPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        checkAuth()
    }, [])

    async function checkAuth() {
        try {
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                setIsLoading(false)
                return
            }

            setUser(session.user)

        } catch (error) {
            console.error('Auth check error:', error)
        } finally {
            setIsLoading(false)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-[#2D2D2D] animate-spin mx-auto mb-4" />
                    <p className="text-[#2D2D2D]/60 text-sm uppercase tracking-widest font-bold">
                        Loading Pawgress AI...
                    </p>
                </div>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] text-[#2D2D2D]">
                <Navbar />
                <div className="container mx-auto px-6 py-32">
                    <div className="max-w-2xl mx-auto text-center mt-20">
                        <div className="mb-8 inline-block">
                            <div className="w-20 h-20 bg-[#2D2D2D]/5 border-2 border-[#2D2D2D] rounded-xl flex items-center justify-center mx-auto mb-6">
                                <Lock className="w-10 h-10 text-[#2D2D2D]" />
                            </div>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-6 text-[#2D2D2D]">
                            Authentication <span className="opacity-50">Required</span>
                        </h1>

                        <p className="text-[#2D2D2D]/60 text-lg mb-8 leading-relaxed">
                            Please log in or create an account to start analyzing your dog's behavior and generating custom training plans.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/login"
                                className="px-8 py-4 bg-[#2D2D2D] text-white font-bold tracking-wide rounded-xl hover:bg-black transition-all"
                            >
                                Sign In / Sign Up
                            </Link>
                            <Link
                                href="/"
                                className="px-8 py-4 border border-[#2D2D2D]/20 text-[#2D2D2D] font-bold tracking-wide rounded-xl hover:bg-[#2D2D2D]/5 transition-all"
                            >
                                Back to Home
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#FDFBF7] text-[#2D2D2D] font-sans selection:bg-[#2D2D2D] selection:text-white">
            <Navbar />
            <div className="pt-24 pb-12 w-full min-h-screen">
                <PawgressApp userId={user.id} />
            </div>
            <Footer />
        </div>
    )
}
