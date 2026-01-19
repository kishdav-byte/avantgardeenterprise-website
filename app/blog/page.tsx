"use client"

import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { motion } from "framer-motion"
import { supabase } from "@/lib/supabaseClient"
import { useEffect, useState } from "react"
import Link from "next/link"

interface Blog {
    id: string;
    title: string;
    content: string;
    published_at: string;
    featured_image?: string;
    excerpt?: string;
    slug: string;
}

export default function BlogPage() {
    const [blogs, setBlogs] = useState<Blog[]>([])
    const [loading, setLoading] = useState(true)

    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let mounted = true

        // SAFETY TIMEOUT: If nothing happens in 10 seconds, stop the spinner
        const timeoutId = setTimeout(() => {
            if (mounted && loading) {
                console.warn("Blog transmission timed out.")
                setLoading(false)
                setError("Transmission timed out. Please check your connection.")
            }
        }, 10000)

        const fetchBlogs = async () => {
            console.log("Transmission initiated: Fetching blogs...")
            const startTime = Date.now()

            try {
                // EXTREME SIMPLIFICATION: No filtering, no ordering. Just get the data.
                const { data, error } = await supabase
                    .from('blogs')
                    .select('id, title, excerpt, content, published_at, featured_image, slug')
                    .limit(10)

                const duration = Date.now() - startTime
                console.log(`Transmission complete: ${duration}ms`)

                if (error) throw error

                if (mounted && data) {
                    setBlogs(data as Blog[])
                }
            } catch (err: any) {
                console.error("Transmission Failure:", err)
                if (mounted) setError(err.message || "Connection timed out")
            } finally {
                if (mounted) setLoading(false)
            }
        }

        fetchBlogs()
        return () => {
            mounted = false
            clearTimeout(timeoutId)
        }
    }, [])

    return (
        <main className="min-h-screen bg-background text-foreground">
            <Navbar />

            <section className="pt-40 pb-20 px-4">
                <div className="container mx-auto max-w-5xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-20"
                    >
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase mb-6">
                            The <span className="text-accent">Intel</span>
                        </h1>
                        <p className="text-white/40 uppercase tracking-[0.4em] text-sm">Insights // Strategy // Future Proofing</p>
                    </motion.div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : blogs.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            {blogs.map((blog, index) => (
                                <motion.article
                                    key={blog.id}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="group relative flex flex-col h-full bg-white/5 border border-white/10 overflow-hidden rounded-xl hover:border-accent/50 transition-colors"
                                >
                                    {blog.featured_image && (
                                        <div className="aspect-video w-full overflow-hidden">
                                            <img
                                                src={blog.featured_image}
                                                alt={blog.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        </div>
                                    )}
                                    <div className="p-6 flex flex-col flex-grow">
                                        <time className="text-accent text-[10px] font-bold tracking-widest uppercase mb-3 block">
                                            {blog.published_at ? new Date(blog.published_at).toLocaleDateString('en-US', {
                                                timeZone: 'UTC',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            }) : 'Recently'}
                                        </time>
                                        <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 group-hover:text-accent transition-colors leading-tight">
                                            <Link href={`/blog/${blog.id}`} className="hover:underline decoration-transparent hover:decoration-accent transition-all">
                                                {blog.title}
                                            </Link>
                                        </h2>
                                        <p className="text-white/50 line-clamp-3 text-sm leading-relaxed mb-6 flex-grow">
                                            {blog.excerpt || blog.content.replace(/<[^>]*>?/gm, '').substring(0, 150) + "..."}
                                        </p>
                                        <Link href={`/blog/${blog.id}`} className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white hover:text-accent transition-colors mt-auto">
                                            Read Full Article <span className="text-lg">→</span>
                                        </Link>
                                    </div>
                                </motion.article>
                            ))}
                        </div>
                    ) : (
                        <div className="py-20 text-center border border-dashed border-white/10 rounded-2xl bg-white/5">
                            <p className="text-white/30 uppercase tracking-widest text-sm">
                                {error ? `Transmission Error: ${error}` : 'Transmission pending... No articles found yet.'}
                            </p>
                        </div>
                    )}
                </div>
            </section>

            <Footer />
        </main>
    )
}
