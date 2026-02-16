import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'AI Meal Planner | Avant-Garde Enterprise',
    description: 'Optimize your nutrition with our AI-powered meal planning tool. Professional grade dietary engineering.',
    alternates: {
        canonical: '/tools/meal-planner',
    },
}

export default function MealPlannerLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
