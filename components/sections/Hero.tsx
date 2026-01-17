"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

export function Hero() {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Background Image/Overlay (Simulating the image's dark, angular background) */}
            <div className="absolute inset-0 z-0 bg-black">
                <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: `linear-gradient(rgba(255, 95, 31, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 95, 31, 0.05) 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }} />

                {/* Simulated Orange "Heat" streaks from the image */}
                <div className="absolute top-[20%] right-[-10%] w-[800px] h-[2px] bg-accent/20 rotate-[-15deg] blur-xl" />
                <div className="absolute bottom-[30%] left-[-10%] w-[600px] h-[1px] bg-accent/40 rotate-[35deg] blur-md" />

                {/* Background Shadow Masks */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
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

                {/* The "START PROJECT" Button matching the glass style of the uploaded image */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="relative group cursor-pointer"
                >
                    <div className="absolute inset-x-[-20px] inset-y-[-10px] bg-accent/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Glass Container */}
                    <div className="relative px-12 py-5 bg-white/5 backdrop-blur-md border border-white/10 overflow-hidden group">
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                        {/* Inner Orange Border Box */}
                        <div className="border-2 border-accent px-8 py-2 relative">
                            {/* Decorative Corner Cut (as seen in image) */}
                            <div className="absolute -top-1 -left-1 w-2 h-2 bg-black" />
                            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-black" />

                            <span className="text-accent text-[14px] font-black tracking-[0.3em] uppercase">
                                Start Project
                            </span>
                        </div>
                    </div>

                    {/* Decorative Outside Bracket lines */}
                    <div className="absolute -left-2 top-0 bottom-0 w-[1px] bg-accent/30" />
                    <div className="absolute -right-2 top-0 bottom-0 w-[1px] bg-accent/30" />
                </motion.div>

                {/* Scrolling Label */}
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-30">
                    <span className="text-[9px] font-bold tracking-[0.4em] uppercase">Scroll to explore</span>
                    <div className="w-px h-12 bg-gradient-to-b from-accent to-transparent" />
                </div>
            </div>
        </section>
    )
}
