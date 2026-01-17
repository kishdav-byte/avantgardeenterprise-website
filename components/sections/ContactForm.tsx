"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { z } from "zod"

const contactSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    message: z.string().min(10, "Message must be at least 10 characters"),
})

export function ContactForm() {
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
    const [errors, setErrors] = useState<Record<string, string>>({})

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setErrors({})
        setStatus("idle")

        const formData = new FormData(e.currentTarget)
        const data = {
            name: formData.get("name") as string,
            email: formData.get("email") as string,
            message: formData.get("message") as string,
        }

        // Client-side validation
        const result = contactSchema.safeParse(data)
        if (!result.success) {
            const formattedErrors: Record<string, string> = {}
            result.error.issues.forEach((issue) => {
                formattedErrors[String(issue.path[0])] = issue.message
            })
            setErrors(formattedErrors)
            setLoading(false)
            return
        }

        try {
            const response = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!response.ok) throw new Error("Failed to submit")

            setStatus("success")
            e.currentTarget.reset()
        } catch {
            setStatus("error")
        } finally {
            setLoading(false)
        }
    }

    return (
        <section id="contact" className="py-24 border-t border-white/5 relative">
            <div className="container px-4 mx-auto max-w-2xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-8 text-center">
                        START THE CONVERSATION
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-6 bg-white/5 p-8 rounded-2xl border border-white/10">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium mb-2 text-white/70">
                                Name
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                className="w-full bg-black/50 border border-white/20 rounded-lg p-3 text-white focus:outline-none focus:border-accent transition-colors"
                                placeholder="John Doe"
                            />
                            {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium mb-2 text-white/70">
                                Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                className="w-full bg-black/50 border border-white/20 rounded-lg p-3 text-white focus:outline-none focus:border-accent transition-colors"
                                placeholder="john@example.com"
                            />
                            {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
                        </div>

                        <div>
                            <label htmlFor="message" className="block text-sm font-medium mb-2 text-white/70">
                                Message
                            </label>
                            <textarea
                                id="message"
                                name="message"
                                rows={4}
                                className="w-full bg-black/50 border border-white/20 rounded-lg p-3 text-white focus:outline-none focus:border-accent transition-colors resize-none"
                                placeholder="Tell us about your project..."
                            />
                            {errors.message && <p className="text-red-400 text-sm mt-1">{errors.message}</p>}
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 text-lg bg-white text-black hover:bg-accent hover:text-black font-bold tracking-wide"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                                </>
                            ) : (
                                "Send Message"
                            )}
                        </Button>

                        {status === "success" && (
                            <p className="text-accent text-center mt-4">Message sent successfully! We'll be in touch.</p>
                        )}
                        {status === "error" && (
                            <p className="text-red-400 text-center mt-4">Something went wrong. Please try again.</p>
                        )}
                    </form>
                </motion.div>
            </div>
        </section>
    )
}
