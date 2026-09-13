"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Check, Sparkles, Zap, ArrowRight, Loader2, ShieldCheck, Gift } from "lucide-react"
import { SPACE_PLANNER_CREDIT_PACKAGES, CreditPackageId } from "@/lib/space-planner-types"

interface PricingCardsProps {
    onSelectFreeSample?: () => void
    userLoggedIn?: boolean
}

export function PricingCards({ onSelectFreeSample, userLoggedIn = false }: PricingCardsProps) {
    const [loadingPkg, setLoadingPkg] = useState<string | null>(null)

    async function handleBuyCredits(packageId: CreditPackageId) {
        try {
            setLoadingPkg(packageId)

            const res = await fetch('/api/space-planner/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ packageId }),
            })

            const data = await res.json()
            if (data.url) {
                window.location.href = data.url
            } else if (res.status === 401) {
                window.location.href = `/login?redirect=/tools/space-planner`
            } else {
                alert(data.error || 'Failed to initialize checkout. Please try again.')
            }
        } catch (err: any) {
            console.error('Checkout error:', err)
            alert('Checkout initialization error. Please check your connection.')
        } finally {
            setLoadingPkg(null)
        }
    }

    return (
        <section id="pricing" className="py-16 relative">
            <div className="container mx-auto px-4 max-w-7xl">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[11px] font-bold uppercase tracking-widest mb-4">
                        <Zap size={14} /> Flexible Pay-Per-Room Model
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-4">
                        Credit Packs. <span className="text-accent">Zero Subscriptions.</span>
                    </h2>
                    <p className="text-white/60 text-sm md:text-base leading-relaxed">
                        Start with your complimentary room audit. Purchase additional room credits on-demand with zero recurring commitments—credits never expire.
                    </p>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
                    {/* Free Sample Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="flex flex-col p-8 rounded-3xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all duration-300 relative group"
                    >
                        <div className="mb-6">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                                <Gift size={20} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                                Free Sample
                            </span>
                            <h3 className="text-xl font-bold uppercase tracking-tight text-white mt-3">
                                1st Room Audit
                            </h3>
                            <p className="text-white/50 text-xs mt-1">
                                Complete trial audit for any room
                            </p>
                        </div>

                        <div className="mb-6 pb-6 border-b border-white/10">
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black text-white">$0</span>
                                <span className="text-white/40 text-xs font-bold uppercase tracking-wider">/ Free</span>
                            </div>
                            <p className="text-[11px] text-emerald-400 font-semibold mt-1">
                                1 Room Credit included at sign up
                            </p>
                        </div>

                        <ul className="space-y-3 mb-8 flex-grow text-xs text-white/70">
                            <li className="flex items-center gap-2">
                                <Check size={14} className="text-emerald-400 shrink-0" />
                                <span>Full multimodal clutter analysis</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check size={14} className="text-emerald-400 shrink-0" />
                                <span>Home, Classroom, or Business track</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check size={14} className="text-emerald-400 shrink-0" />
                                <span>Timed phased declutter plan</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check size={14} className="text-emerald-400 shrink-0" />
                                <span>Curated Amazon affiliate product list</span>
                            </li>
                            <li className="flex items-center gap-2 text-white/40">
                                <Check size={14} className="text-white/30 shrink-0" />
                                <span>Standard priority queue</span>
                            </li>
                        </ul>

                        <button
                            onClick={onSelectFreeSample}
                            className="w-full py-3.5 rounded-xl border border-white/20 text-white hover:bg-white/10 font-bold uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2"
                        >
                            <span>Claim Free Audit</span>
                            <ArrowRight size={14} />
                        </button>
                    </motion.div>

                    {/* Paid Packages */}
                    {SPACE_PLANNER_CREDIT_PACKAGES.map((pkg, idx) => {
                        const isPopular = pkg.isPopular
                        const isBestValue = pkg.isBestValue

                        return (
                            <motion.div
                                key={pkg.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: (idx + 1) * 0.1 }}
                                className={`flex flex-col p-8 rounded-3xl transition-all duration-300 relative group ${isPopular
                                        ? 'bg-gradient-to-b from-accent/10 via-white/[0.03] to-transparent border-2 border-accent shadow-[0_0_40px_rgba(255,107,0,0.15)]'
                                        : 'bg-white/[0.02] border border-white/10 hover:border-accent/40'
                                    }`}
                            >
                                {/* Badge */}
                                {isPopular && (
                                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                                        <span className="px-3 py-1 bg-accent text-black text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg flex items-center gap-1">
                                            <Sparkles size={12} /> Most Popular
                                        </span>
                                    </div>
                                )}
                                {isBestValue && (
                                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                                        <span className="px-3 py-1 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                                            Best Value • Save 46%
                                        </span>
                                    </div>
                                )}

                                <div className="mb-6">
                                    <div className="w-10 h-10 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mb-4">
                                        <Zap size={20} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-accent/80 bg-accent/10 px-2.5 py-0.5 rounded-full">
                                        {pkg.credits} Room Credit{pkg.credits > 1 ? 's' : ''}
                                    </span>
                                    <h3 className="text-xl font-bold uppercase tracking-tight text-white mt-3">
                                        {pkg.name}
                                    </h3>
                                    <p className="text-white/50 text-xs mt-1">
                                        {pkg.description}
                                    </p>
                                </div>

                                <div className="mb-6 pb-6 border-b border-white/10">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black text-white">${pkg.price}</span>
                                        <span className="text-white/40 text-xs font-bold uppercase tracking-wider">one-time</span>
                                    </div>
                                    <p className="text-[11px] text-white/40 font-medium mt-1">
                                        {pkg.unit_price_display}
                                    </p>
                                </div>

                                <ul className="space-y-3 mb-8 flex-grow text-xs text-white/70">
                                    <li className="flex items-center gap-2">
                                        <Check size={14} className="text-accent shrink-0" />
                                        <span><strong>{pkg.credits} Full Room Audits</strong></span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check size={14} className="text-accent shrink-0" />
                                        <span>DALL-E 3 visual concept mockups</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check size={14} className="text-accent shrink-0" />
                                        <span>Instant Amazon affiliate shopping kits</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check size={14} className="text-accent shrink-0" />
                                        <span>Zero expiration date on credits</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check size={14} className="text-accent shrink-0" />
                                        <span>High-priority multimodal queue</span>
                                    </li>
                                </ul>

                                <button
                                    onClick={() => handleBuyCredits(pkg.id)}
                                    disabled={loadingPkg === pkg.id}
                                    className={`w-full py-3.5 rounded-xl font-bold uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2 ${isPopular
                                            ? 'bg-accent text-black hover:bg-accent/90 shadow-lg'
                                            : 'bg-white/10 text-white hover:bg-white/20'
                                        }`}
                                >
                                    {loadingPkg === pkg.id ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            <span>Connecting to Stripe...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Get {pkg.credits} Credit{pkg.credits > 1 ? 's' : ''}</span>
                                            <ArrowRight size={14} />
                                        </>
                                    )}
                                </button>
                            </motion.div>
                        )
                    })}
                </div>

                {/* Trust guarantee */}
                <div className="mt-12 text-center flex items-center justify-center gap-6 text-xs text-white/40">
                    <span className="flex items-center gap-1.5">
                        <ShieldCheck size={16} className="text-accent" /> 256-Bit Encrypted Stripe Checkout
                    </span>
                    <span>•</span>
                    <span>No Automatic Renewals</span>
                    <span>•</span>
                    <span>Credits Never Expire</span>
                </div>
            </div>
        </section>
    )
}
