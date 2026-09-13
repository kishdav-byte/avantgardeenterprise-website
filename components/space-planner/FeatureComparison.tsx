"use client"

import { motion } from "framer-motion"
import { Check, Sparkles, Home, GraduationCap, Building2 } from "lucide-react"

interface FeatureRow {
    feature: string
    description: string
    home: string | boolean
    classroom: string | boolean
    business: string | boolean
}

const comparisonFeatures: FeatureRow[] = [
    {
        feature: "Target Spaces",
        description: "Primary room taxonomy supported",
        home: "Living, Kitchen, Pantry, Closets, Garage, Bedroom",
        classroom: "Elementary, STEM Lab, Sensory Nook, Teacher Prep",
        business: "Retail Floor, Stockroom, Commercial Office, Kitchen",
    },
    {
        feature: "Clutter & Spatial Focus",
        description: "Core organizational algorithm priorities",
        home: "Family access, pet zones, seasonal rotation & habits",
        classroom: "Student flow, center transitions, cubby stations",
        business: "Aisle clearance, FIFO picking, high turnover racks",
    },
    {
        feature: "Safety & Compliance Checks",
        description: "Environment-specific regulatory alignment",
        home: "Child/pet safety & ergonomics",
        classroom: "Non-tip heavy bins & ADA routes",
        business: "OSHA clearances, ADA paths, Health Code NSF",
    },
    {
        feature: "Lifestyle & Operational Metrics",
        description: "Custom environment variables analyzed",
        home: "Family size, pets, age groups, aesthetic",
        classroom: "Student count, grade level, sensory needs",
        business: "Employee count, foot traffic, SKU turnover",
    },
    {
        feature: "Timed Phased Declutter Plan",
        description: "Step-by-step action roadmaps with zones",
        home: true,
        classroom: true,
        business: true,
    },
    {
        feature: "Visual 'After' Mockup (DALL-E 3)",
        description: "Photorealistic architectural concept image",
        home: true,
        classroom: true,
        business: true,
    },
    {
        feature: "Amazon Affiliate Shopping Kit",
        description: "Curated bins, shelves, and hardware with direct checkout",
        home: "Residential organizers & containers",
        classroom: "Heavy-duty color bins & carts",
        business: "NSF shelving, Akro-Mils & labelers",
    },
    {
        feature: "Credit Requirement",
        description: "Transparent pay-per-room credit cost",
        home: "1 Credit (or Free Sample)",
        classroom: "1 Credit (or Free Sample)",
        business: "1 Credit (or Free Sample)",
    },
]

export function FeatureComparison() {
    return (
        <section id="comparison" className="py-16 relative">
            <div className="container mx-auto px-4 max-w-7xl">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[11px] font-bold uppercase tracking-widest mb-4">
                        <Sparkles size={14} /> Multi-Track Architecture
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-4">
                        Tailored for <span className="text-accent">Every Environment</span>
                    </h2>
                    <p className="text-white/60 text-sm md:text-base leading-relaxed">
                        SpacePlan AI doesn’t just apply a generic template. Our multimodal engine shifts prompt engineering, safety heuristics, and product recommendations to match the exact dynamics of your environment.
                    </p>
                </div>

                {/* Table Container */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-sm"
                >
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/[0.03]">
                                <th className="p-6 text-xs font-black uppercase tracking-widest text-white/50 w-1/4">
                                    Capability
                                </th>
                                <th className="p-6 text-center w-1/4">
                                    <div className="inline-flex items-center gap-2 text-blue-400 font-bold uppercase text-xs tracking-wider">
                                        <Home size={16} /> Home Track
                                    </div>
                                </th>
                                <th className="p-6 text-center w-1/4">
                                    <div className="inline-flex items-center gap-2 text-emerald-400 font-bold uppercase text-xs tracking-wider">
                                        <GraduationCap size={16} /> Classroom Track
                                    </div>
                                </th>
                                <th className="p-6 text-center w-1/4">
                                    <div className="inline-flex items-center gap-2 text-amber-400 font-bold uppercase text-xs tracking-wider">
                                        <Building2 size={16} /> Business / Enterprise
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-xs">
                            {comparisonFeatures.map((row, i) => (
                                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                    {/* Feature Name & Description */}
                                    <td className="p-6">
                                        <p className="font-bold text-white text-sm tracking-tight">{row.feature}</p>
                                        <p className="text-white/40 text-[11px] mt-0.5">{row.description}</p>
                                    </td>

                                    {/* Home Column */}
                                    <td className="p-6 text-center text-white/70">
                                        {typeof row.home === 'boolean' ? (
                                            row.home ? (
                                                <span className="inline-flex p-1 rounded-full bg-blue-500/10 text-blue-400">
                                                    <Check size={16} />
                                                </span>
                                            ) : (
                                                <span className="text-white/20">—</span>
                                            )
                                        ) : (
                                            <span className="font-medium leading-relaxed">{row.home}</span>
                                        )}
                                    </td>

                                    {/* Classroom Column */}
                                    <td className="p-6 text-center text-white/70">
                                        {typeof row.classroom === 'boolean' ? (
                                            row.classroom ? (
                                                <span className="inline-flex p-1 rounded-full bg-emerald-500/10 text-emerald-400">
                                                    <Check size={16} />
                                                </span>
                                            ) : (
                                                <span className="text-white/20">—</span>
                                            )
                                        ) : (
                                            <span className="font-medium leading-relaxed">{row.classroom}</span>
                                        )}
                                    </td>

                                    {/* Business Column */}
                                    <td className="p-6 text-center text-white/70">
                                        {typeof row.business === 'boolean' ? (
                                            row.business ? (
                                                <span className="inline-flex p-1 rounded-full bg-amber-500/10 text-amber-400">
                                                    <Check size={16} />
                                                </span>
                                            ) : (
                                                <span className="text-white/20">—</span>
                                            )
                                        ) : (
                                            <span className="font-medium leading-relaxed">{row.business}</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </motion.div>
            </div>
        </section>
    )
}
