"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

import { motion } from "framer-motion"
import Link from "next/link"
import { ChefHat, Lock, Sparkles, ArrowRight, Dog, User, ShieldCheck } from "lucide-react"
interface Tool {
    id: string
    name: string
    description: string
    icon: React.ReactNode
    href: string
    status: "beta" | "coming-soon" | "active"
    isFree: boolean
    requiresAuth: boolean
    isAdminOnly?: boolean
}

const tools: Tool[] = [
    {
        id: "meal-planner",
        name: "ButlerAI",
        description: "Transform your kitchen inventory into personalized weekly meal plans. Upload photos of your fridge, pantry, and spices—or skip inventory and discover new recipes based on your preferences.",
        icon: <ChefHat className="w-8 h-8" />,
        href: "/tools/meal-planner",
        status: "beta",
        isFree: true,
        requiresAuth: true
    },
    {
        id: "k9-training",
        name: "Pawgress AI",
        description: "AI-powered dog training Micro-SaaS. Analyze your dog's behavior via video and generate dynamic 30-day training regimens tailored to your specific goals.",
        icon: <Dog className="w-8 h-8" />,
        href: "/product/k9-training",
        status: "beta",
        isFree: false,
        requiresAuth: true
    },
    {
        id: "tai-chi-app",
        name: "Tai Chi Planner",
        description: "AI-generated Tai Chi plans tailored to your goals and abilities, featuring visual guides.",
        icon: <User className="w-8 h-8" />, // imported User icon
        href: "/tools/tai-chi",
        status: "active",
        isFree: true,
        requiresAuth: true,
        isAdminOnly: true
    },
    {
        id: "capitol-radar",
        name: "Capitol Radar",
        description: "Surveil Congressional stock transactions in real-time. Automatically checks conflict-of-interest committee overlap triggers.",
        icon: <ShieldCheck className="w-8 h-8" />,
        href: "/products/capitol-radar",
        status: "active",
        isFree: false,
        requiresAuth: false
    },
] // Add more tools here as they're developed

export function IntelligentTools() {
    const [isAdmin, setIsAdmin] = useState(false)

    useEffect(() => {
        const checkAdmin = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase.from('clients').select('role').eq('id', user.id).maybeSingle()
                if (profile?.role === 'admin') {
                    setIsAdmin(true)
                }
            }
        }
        checkAdmin()
    }, [])

    const visibleTools = tools.filter(tool => !tool.isAdminOnly || isAdmin)

    return (
        <section id="intelligent-tools" className="relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-accent/5 pointer-events-none" />
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10">
                {/* Separator with star */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex items-center justify-center gap-4 mb-20"
                >
                    <div className="w-16 h-0.5 bg-gradient-to-r from-transparent to-accent rounded-full" />
                    <Sparkles className="text-secondary" size={22} />
                    <div className="w-16 h-0.5 bg-gradient-to-l from-transparent to-secondary rounded-full" />
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {visibleTools.map((tool, index) => (
                        <motion.div
                            key={tool.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Link
                                href={tool.href}
                                className="group relative block h-full bg-white/[0.02] border border-white/5 p-8 hover:border-accent/30 rounded-3xl transition-all duration-300 overflow-hidden backdrop-blur-sm shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
                            >
                                {/* Hover gradient effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                {/* Status badges */}
                                <div className="absolute top-6 right-6 flex gap-2 z-10">
                                    {tool.status === "beta" && (
                                        <span className="px-2.5 py-0.5 rounded-full bg-accent/15 text-accent text-[10px] font-semibold uppercase tracking-wider">
                                            Beta
                                        </span>
                                    )}
                                    {tool.isFree && (
                                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold uppercase tracking-wider">
                                            Free
                                        </span>
                                    )}
                                    {tool.status === "coming-soon" && (
                                        <span className="px-2.5 py-0.5 rounded-full bg-white/5 text-white/40 text-[10px] font-semibold uppercase tracking-wider">
                                            Soon
                                        </span>
                                    )}
                                </div>

                                <div className="relative z-10 flex flex-col h-full">
                                    {/* Icon */}
                                    <div className="mb-6 text-accent group-hover:scale-110 transition-transform duration-300">
                                        {tool.icon}
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-xl font-bold tracking-tight mb-3 group-hover:text-accent transition-colors text-white">
                                        {tool.name}
                                    </h3>

                                    {/* Description */}
                                    <p className="text-white/60 text-sm leading-relaxed mb-6 flex-grow">
                                        {tool.description}
                                    </p>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                        <div className="flex items-center gap-2 text-[10px] font-medium tracking-wider text-white/40">
                                            {tool.requiresAuth && (
                                                <>
                                                    <Lock size={12} />
                                                    <span>Login Required</span>
                                                </>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-accent text-xs font-semibold tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <span>Launch</span>
                                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                {/* Beta notice */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="mt-16 text-center"
                >
                    <div className="inline-block bg-white/[0.02] border border-white/5 rounded-3xl px-8 py-6 max-w-3xl backdrop-blur-md shadow-lg">
                        <p className="text-white/40 text-xs uppercase tracking-widest font-medium mb-2">
                            Early Access Program
                        </p>
                        <p className="text-white/60 text-sm leading-relaxed">
                            Beta tools are currently <span className="text-accent font-bold">free to use</span> with monthly limits.
                            Subscription pricing will be introduced upon full release.
                            <span className="text-white/80 font-semibold"> Admin accounts have unlimited access.</span>
                        </p>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
