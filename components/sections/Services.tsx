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
                    <div className="h-1 w-20 bg-accent" />
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {services.map((service, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            className="group p-8 border border-white/10 hover:border-accent/50 bg-white/5 hover:bg-white/10 transition-colors relative overflow-hidden"
                        >
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowUpRight className="text-accent" />
                            </div>
                            <div className="mb-6 inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 text-accent group-hover:scale-110 transition-transform">
                                <service.icon size={24} />
                            </div>
                            <h3 className="text-xl font-bold mb-3 group-hover:text-accent transition-colors">
                                {service.title}
                            </h3>
                            <p className="text-white/60 leading-relaxed">
                                {service.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
