import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Contact | Avant-Garde Enterprise',
    description: 'Establish contact with our team for inquiries regarding AI architecture, enterprise solutions, and strategic digital transformation.',
    alternates: {
        canonical: '/contact',
    },
}

export default function ContactLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
