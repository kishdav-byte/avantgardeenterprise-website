import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Products | Avant-Garde Enterprise',
    description: 'Discover our suite of intelligent tools and products designed to optimize enterprise workflows and career development.',
    alternates: {
        canonical: '/products',
    },
}

export default function ProductsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
