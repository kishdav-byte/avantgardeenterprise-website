"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ChefHat, Lock, Sparkles, ArrowRight } from "lucide-react"

interface Tool {
    id: string
    name: string
    description: string
    icon: React.ReactNode
    href: string
    status: "beta" | "coming-soon" | "active"
    isFree: boolean
    requiresAuth: boolean
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
    // Add more tools here as they're developed
]

export function IntelligentTools() {
    return (
        <section id="intelligent-tools" className="relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent pointer-events-none" />
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10">
                {/* Separator with star */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex items-center justify-center gap-3 mb-16"
                >
                    <div className="w-12 h-px bg-accent" />
                    <Sparkles className="text-accent" size={20} />
                    <div className="w-12 h-px bg-accent" />
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {tools.map((tool, index) => (
                        <motion.div
                            key={tool.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Link
                                href={tool.href}
                                className="group relative block h-full bg-white/5 border border-white/10 p-8 hover:border-accent/50 transition-all duration-300 overflow-hidden"
                            >
                                {/* Hover gradient effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                {/* Status badges */}
                                <div className="absolute top-4 right-4 flex gap-2 z-10">
                                    {tool.status === "beta" && (
                                        <span className="px-3 py-1 bg-accent/20 text-accent text-[9px] font-black uppercase tracking-widest border border-accent/30">
                                            Beta
                                        </span>
                                    )}
                                    {tool.isFree && (
                                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest border border-emerald-500/30">
                                            Free
                                        </span>
                                    )}
                                    {tool.status === "coming-soon" && (
                                        <span className="px-3 py-1 bg-white/10 text-white/50 text-[9px] font-black uppercase tracking-widest border border-white/20">
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
                                    <h3 className="text-2xl font-black uppercase tracking-tighter mb-4 group-hover:text-accent transition-colors">
                                        {tool.name}
                                    </h3>

                                    {/* Description */}
                                    <p className="text-white/60 text-sm leading-relaxed mb-6 flex-grow">
                                        {tool.description}
                                    </p>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                                            {tool.requiresAuth && (
                                                <>
                                                    <Lock size={12} />
                                                    <span>Login Required</span>
                                                </>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-accent text-xs font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span>Launch</span>
                                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </div>

                                {/* Decorative corner element */}
                                <div className="absolute bottom-0 left-0 w-16 h-16 border-l-2 border-b-2 border-accent/20 opacity-0 group-hover:opacity-100 transition-opacity" />
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
                    <div className="inline-block bg-white/5 border border-white/10 px-8 py-4 max-w-3xl">
                        <p className="text-white/40 text-xs uppercase tracking-widest font-bold mb-2">
                            Early Access Program
                        </p>
                        <p className="text-white/60 text-sm leading-relaxed">
                            Beta tools are currently <span className="text-accent font-bold">free to use</span> with monthly limits.
                            Subscription pricing will be introduced upon full release.
                            <span className="text-white/80 font-bold"> Admin accounts have unlimited access.</span>
                        </p>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
