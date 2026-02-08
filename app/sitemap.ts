import { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabaseClient'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://avant-gardeenterprise.com'

    // Static routes
    const routes = [
        '',
        '/about',
        '/services',
        '/products',
        '/ai-readiness',
        '/portfolio',
        '/blog',
        '/contact',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: route === '' ? 1 : 0.8,
    }))

    // Dynamic blog routes
    try {
        const { data: blogs } = await supabase
            .from('blogs')
            .select('id, updated_at')
            .eq('status', 'published')

        if (blogs) {
            const blogRoutes = blogs.map((blog) => ({
                url: `${baseUrl}/blog/${blog.id}`,
                lastModified: new Date(blog.updated_at || new Date()),
                changeFrequency: 'monthly' as const,
                priority: 0.6,
            }))
            return [...routes, ...blogRoutes]
        }
    } catch (error) {
        console.error('Error generating dynamic sitemap routes:', error)
    }

    return routes
}
