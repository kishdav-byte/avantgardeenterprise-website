"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function Hero() {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Background Image/Overlay with Cyber-Organic Aurora lights */}
            <div className="absolute inset-0 z-0 bg-background overflow-hidden">
                {/* Aurora glows */}
                <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-accent/10 blur-[130px] mix-blend-screen" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-secondary/10 blur-[160px] mix-blend-screen" />
                
                {/* Subtle soft digital mesh */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: `radial-gradient(var(--secondary) 1px, transparent 0), radial-gradient(var(--accent) 1px, transparent 0)`,
                    backgroundSize: '48px 48px',
                    backgroundPosition: '0 0, 24px 24px'
                }} />

                {/* Background Shadow Masks */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background" />
            </div>

            <div className="container relative z-10 px-4 flex flex-col items-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    className="text-center"
                >
                    <h1 className="text-[14vw] md:text-[120px] font-black tracking-[-0.04em] leading-[0.85] uppercase mb-12">
                        BUILD THE <br />
                        <span className="text-white">UNIMAGINABLE</span>
                    </h1>
                </motion.div>

                {/* The new creative/organic CTA button */}
                <Link
                    href="/login"
                    className="relative group cursor-pointer"
                >
                    {/* Glow outline behind button */}
                    <div className="absolute -inset-1.5 bg-gradient-to-r from-accent to-secondary rounded-full blur-lg opacity-30 group-hover:opacity-60 transition duration-500" />
                    
                    {/* Main rounded-full glass button */}
                    <div className="relative px-10 py-4 bg-white/[0.04] hover:bg-white/[0.08] backdrop-blur-md border border-white/10 rounded-full transition-all duration-300 flex items-center justify-center gap-4">
                        <span className="text-white text-sm font-semibold tracking-wider uppercase">
                            Get Started
                        </span>
                        {/* A tiny growing circle dot for organic feedback */}
                        <div className="w-2.5 h-2.5 bg-accent rounded-full transition-transform duration-300 group-hover:scale-150 shadow-[0_0_8px_var(--accent)]" />
                    </div>
                </Link>

                {/* Scrolling Label */}
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-30">
                    <span className="text-[9px] font-bold tracking-[0.4em] uppercase">Scroll to explore</span>
                    <div className="w-px h-12 bg-gradient-to-b from-accent via-secondary to-transparent" />
                </div>
            </div>
        </section>
    )
}
