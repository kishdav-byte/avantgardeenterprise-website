import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'SpaceIQ | Avant-Garde Enterprise',
    description: 'AI-powered multimodal room and space organization planner for home, classroom, and business environments.',
    alternates: {
        canonical: '/tools/space-planner',
    },
}

export default function SpacePlannerLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
