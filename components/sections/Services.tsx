"use client"

import { motion } from "framer-motion"
import { Monitor, Smartphone, Code2, ArrowUpRight } from "lucide-react"

const services = [
    {
        icon: Monitor,
        title: "Digital Strategy",
        description: "We navigate the complex digital landscape to position your brand at the forefront of innovation.",
    },
    {
        icon: Smartphone,
        title: "Product Design",
        description: "Crafting intuitive, aesthetic interfaces that resonate with users and drive engagement.",
    },
    {
        icon: Code2,
        title: "Engineering",
        description: "Building robust, scalable architectures that power the next generation of web applications.",
    },
]

export function Services() {
    return (
        <section id="services" className="py-24 bg-background relative border-t border-white/5">
            <div className="container px-4 mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="mb-16"
                >
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-4">OUR EXPERTISE</h2>
                    <div className="h-1 w-20 bg-gradient-to-r from-accent to-secondary rounded-full" />
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {services.map((service, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            className="group p-8 border border-white/5 hover:border-accent/30 bg-white/[0.02] hover:bg-white/[0.04] rounded-3xl transition-all duration-300 relative overflow-hidden backdrop-blur-sm shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
                        >
                            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <ArrowUpRight className="text-accent" size={20} />
                            </div>
                            <div className="mb-6 inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-secondary/10 text-secondary group-hover:bg-accent/10 group-hover:text-accent group-hover:scale-110 transition-all duration-300">
                                <service.icon size={22} />
                            </div>
                            <h3 className="text-xl font-bold mb-3 group-hover:text-accent transition-colors">
                                {service.title}
                            </h3>
                            <p className="text-white/60 leading-relaxed text-sm">
                                {service.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
