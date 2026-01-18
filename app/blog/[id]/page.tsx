"use client"

import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { motion } from "framer-motion"
import { supabase } from "@/lib/supabaseClient"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"

interface Blog {
    id: string;
    title: string;
    content: string;
    published_at: string;
    created_at: string;
    featured_image: string;
}

export default function BlogPostPage() {
    const params = useParams()
    const [blog, setBlog] = useState<Blog | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchBlog() {
            const { data, error } = await supabase
                .from('blogs')
                .select('*')
                .eq('id', params.id)
                .single()

            if (data) setBlog(data)
            setLoading(false)
        }
        if (params.id) fetchBlog()
    }, [params.id])

    if (loading) return (
        <main className="min-h-screen bg-background text-foreground flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </main>
    )

    if (!blog) return (
        <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-6">
            <h1 className="text-4xl font-bold uppercase tracking-tighter">Article Not Found</h1>
            <Link href="/blog" className="text-accent uppercase tracking-widest text-sm font-bold hover:underline">← Back to Blog</Link>
        </main>
    )

    return (
        <main className="min-h-screen bg-background text-foreground">
            <Navbar />

            <article className="pt-48 pb-32 px-4">
                <div className="container mx-auto max-w-3xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Link href="/blog" className="text-white/30 hover:text-accent transition-colors uppercase tracking-[0.2em] text-[10px] font-bold mb-12 inline-block">
                            ← Return to Index
                        </Link>

                        <time className="block text-accent text-xs font-bold tracking-[0.4em] uppercase mb-4">
                            {new Date(blog.published_at || blog.created_at).toLocaleDateString('en-US', {
                                timeZone: 'UTC',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </time>

                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-20 leading-tight">
                            {blog.title}
                        </h1>

                        {/* Featured Image */}
                        {blog.featured_image && (
                            <div className="mb-16 rounded-2xl overflow-hidden border border-white/10 aspect-video relative">
                                <img
                                    src={blog.featured_image}
                                    alt={blog.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}

                        {/* Content */}
                        <div
                            className="prose prose-invert prose-lg max-w-none text-white/70 leading-relaxed font-light [&>h2]:text-white [&>h2]:font-bold [&>h2]:tracking-tighter [&>h2]:uppercase [&>h2]:mb-6 [&>h2]:mt-12 [&>a]:text-accent [&>a]:underline hover:[&>a]:text-white transition-colors"
                            dangerouslySetInnerHTML={{ __html: blog.content }}
                        />
                    </motion.div>
                </div>
            </article>

            <Footer />
        </main>
    )
}
