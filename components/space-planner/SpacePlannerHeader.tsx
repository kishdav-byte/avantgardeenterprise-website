"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { LayoutGrid, Zap, Plus, ArrowLeft, Loader2, Sparkles } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

interface SpacePlannerHeaderProps {
    showBack?: boolean
    backHref?: string
    backLabel?: string
}

export function SpacePlannerHeader({
    showBack = true,
    backHref = "/tools/space-planner",
    backLabel = "Overview",
}: SpacePlannerHeaderProps) {
    const [user, setUser] = useState<any>(null)
    const [credits, setCredits] = useState<{ balance: number; freeSampleAvailable: boolean } | null>(null)
    const [loadingCredits, setLoadingCredits] = useState(false)
    const [buyingCredits, setBuyingCredits] = useState(false)

    useEffect(() => {
        async function loadUserAndCredits() {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)

            if (user) {
                setLoadingCredits(true)
                try {
                    const res = await fetch('/api/space-planner/credits')
                    if (res.ok) {
                        const data = await res.json()
                        setCredits({
                            balance: data.balance ?? 0,
                            freeSampleAvailable: data.freeSampleAvailable ?? false,
                        })
                    }
                } catch (e) {
                    console.error("Failed to load credits:", e)
                } finally {
                    setLoadingCredits(false)
                }
            }
        }

        loadUserAndCredits()
    }, [])

    async function handleQuickBuy() {
        setBuyingCredits(true)
        try {
            const res = await fetch('/api/space-planner/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ packageId: 'standard_3' }),
            })
            const data = await res.json()
            if (data.url) {
                window.location.href = data.url
            } else {
                window.location.href = '/tools/space-planner#pricing'
            }
        } catch {
            window.location.href = '/tools/space-planner#pricing'
        } finally {
            setBuyingCredits(false)
        }
    }

    return (
        <div className="w-full border-b border-white/10 bg-black/40 backdrop-blur-xl sticky top-20 z-40">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                {/* Left: Brand & Back */}
                <div className="flex items-center gap-4">
                    {showBack && (
                        <Link
                            href={backHref}
                            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white/50 hover:text-accent transition-colors"
                        >
                            <ArrowLeft size={14} />
                            <span>{backLabel}</span>
                        </Link>
                    )}
                    <div className="h-4 w-px bg-white/10 hidden sm:block" />
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                            <LayoutGrid size={15} />
                        </div>
                        <span className="text-sm font-black uppercase tracking-tight text-white">
                            SpacePlan <span className="text-accent">AI</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent text-[9px] font-black uppercase tracking-widest border border-accent/30 hidden sm:inline-block">
                            Beta
                        </span>
                    </div>
                </div>

                {/* Right: Credits & Actions */}
                <div className="flex items-center gap-3">
                    {user ? (
                        <>
                            {/* Credit Badge */}
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs">
                                <Zap size={13} className="text-accent" />
                                {loadingCredits ? (
                                    <Loader2 size={12} className="animate-spin text-white/50" />
                                ) : credits ? (
                                    credits.balance > 0 ? (
                                        <span className="font-bold text-white">
                                            {credits.balance} <span className="text-white/50 text-[10px] uppercase font-semibold">Credit{credits.balance > 1 ? 's' : ''}</span>
                                        </span>
                                    ) : credits.freeSampleAvailable ? (
                                        <span className="font-bold text-emerald-400 flex items-center gap-1">
                                            <Sparkles size={11} /> 1 Free Audit
                                        </span>
                                    ) : (
                                        <span className="font-bold text-amber-400 text-[11px] uppercase">
                                            0 Credits
                                        </span>
                                    )
                                ) : (
                                    <span className="text-white/50 text-[11px]">Ready</span>
                                )}
                            </div>

                            {/* Top Up / Get Credits Button */}
                            <button
                                onClick={handleQuickBuy}
                                disabled={buyingCredits}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-accent text-black font-black uppercase text-[10px] tracking-wider hover:bg-accent/90 transition-all shadow-sm"
                            >
                                {buyingCredits ? (
                                    <Loader2 size={12} className="animate-spin" />
                                ) : (
                                    <Plus size={12} strokeWidth={3} />
                                )}
                                <span>Get Credits</span>
                            </button>
                        </>
                    ) : (
                        <Link
                            href="/login?redirect=/tools/space-planner"
                            className="text-xs font-bold uppercase tracking-wider text-accent hover:underline"
                        >
                            Sign In to Audit
                        </Link>
                    )}
                </div>
            </div>
        </div>
    )
}
