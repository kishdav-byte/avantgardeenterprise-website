import { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'

type Props = {
    params: Promise<{ id: string }>
}

export async function generateMetadata(
    { params }: Props
): Promise<Metadata> {
    const id = (await params).id

    // Use a basic server-side client to fetch the title for metadata
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: blog } = await supabase
        .from('blogs')
        .select('title, excerpt')
        .eq('id', id)
        .single()

    return {
        title: `${blog?.title || 'Blog Post'} | Avant-Garde Enterprise`,
        description: blog?.excerpt || "Read our latest article on innovation and technology.",
        alternates: {
            canonical: `/blog/${id}`,
        },
    }
}

export default function BlogPostLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
