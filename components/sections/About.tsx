"use client"

import { motion } from "framer-motion"

export function About() {
    return (
        <section id="about" className="py-24 border-t border-white/5">
            <div className="container px-4 mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-6 leading-tight">
                        WE ARE A <span className="text-accent">COLLECTIVE</span> OF VISIONARIES.
                    </h2>
                    <p className="text-lg text-white/70 mb-6 leading-relaxed">
                        Avant-Garde Enterprise isn't just a studio; it's a movement. We reject the mundane and embrace the extraordinary. Our mission is to disrupt industries through design-driven technology.
                    </p>
                    <p className="text-lg text-white/70 leading-relaxed">
                        From experimental interfaces to mission-critical systems, we bring a level of craft and precision that defines the modern era.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="relative h-[400px] bg-white/5 border border-white/10 flex items-center justify-center p-8 text-center"
                >
                    {/* Decorative abstract elements */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-accent/5 to-transparent pointer-events-none" />
                    <div className="text-9xl font-bold opacity-5 select-none">AGE</div>
                    <div className="absolute bottom-8 right-8 text-right">
                        <div className="text-4xl font-bold text-accent">100+</div>
                        <div className="text-sm uppercase tracking-widest text-white/50">Projects</div>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
