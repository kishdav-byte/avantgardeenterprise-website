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
    published_date: string;
}

export default function BlogPage() {
    const [blogs, setBlogs] = useState<Blog[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchBlogs() {
            const { data, error } = await supabase
                .from('blogs')
                .select('*')
                .order('published_date', { ascending: false })

            if (data) setBlogs(data)
            setLoading(false)
        }
        fetchBlogs()
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
                        <div className="grid grid-cols-1 gap-12">
                            {blogs.map((blog, index) => (
                                <motion.article
                                    key={blog.id}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="group relative border-b border-white/10 pb-12 hover:border-accent/30 transition-colors"
                                >
                                    <div className="flex flex-col md:flex-row md:items-baseline gap-4 mb-4">
                                        <time className="text-accent text-xs font-bold tracking-widest uppercase">
                                            {new Date(blog.published_date).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </time>
                                        <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-tighter group-hover:text-accent transition-colors">
                                            <Link href={`/blog/${blog.id}`}>{blog.title}</Link>
                                        </h2>
                                    </div>
                                    <p className="text-white/50 line-clamp-2 max-w-2xl text-lg leading-relaxed">
                                        {blog.content.replace(/<[^>]*>?/gm, '').substring(0, 200)}...
                                    </p>
                                    <div className="mt-6">
                                        <Link href={`/blog/${blog.id}`} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:text-accent transition-colors">
                                            Read Full Article <span className="text-lg">→</span>
                                        </Link>
                                    </div>
                                </motion.article>
                            ))}
                        </div>
                    ) : (
                        <div className="py-20 text-center border border-dashed border-white/10 rounded-2xl bg-white/5">
                            <p className="text-white/30 uppercase tracking-widest text-sm">Transmission pending... No articles found yet.</p>
                        </div>
                    )}
                </div>
            </section>

            <Footer />
        </main>
    )
}
