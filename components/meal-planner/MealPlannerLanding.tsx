"use client"

import { Upload, BookOpen, Utensils, Calendar } from 'lucide-react'
import { MEAL_PLANNER_CONFIG } from '@/lib/meal-planner-config'
import type { MealPlannerView } from '@/lib/meal-planner-types'

interface MealPlannerLandingProps {
    onNavigate: (view: MealPlannerView, payload?: { inventoryBypassed?: boolean; mode?: 'recipe' | 'meal' }) => void
    hasReachedLimit: boolean
    isAdmin: boolean
}

interface ActionCardProps {
    icon: React.ReactNode
    title: string
    description: string
    onClick: () => void
    disabled?: boolean
}

function ActionCard({ icon, title, description, onClick, disabled }: ActionCardProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className="group relative bg-white/5 border border-white/10 p-8 text-left hover:bg-white/10 hover:border-accent/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white/5 disabled:hover:border-white/10 h-full flex flex-col"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full">
                <div className="mb-6 text-accent group-hover:scale-110 transition-transform">
                    {icon}
                </div>

                <h3 className="text-2xl font-black uppercase tracking-tighter mb-4 group-hover:text-accent transition-colors">
                    {title}
                </h3>

                <p className="text-white/60 text-sm leading-relaxed flex-grow">
                    {description}
                </p>

                <div className="mt-6 pt-4 border-t border-white/10">
                    <span className="text-accent text-xs font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                        Launch →
                    </span>
                </div>
            </div>
        </button>
    )
}

export function MealPlannerLanding({ onNavigate, hasReachedLimit, isAdmin }: MealPlannerLandingProps) {
    const actions = [
        {
            icon: <Upload size={32} />,
            title: MEAL_PLANNER_CONFIG.ui.actions.uploadInventory.title,
            description: MEAL_PLANNER_CONFIG.ui.actions.uploadInventory.description,
            onClick: () => onNavigate('planner', { inventoryBypassed: false })
        },
        {
            icon: <BookOpen size={32} />,
            title: MEAL_PLANNER_CONFIG.ui.actions.createRecipe.title,
            description: MEAL_PLANNER_CONFIG.ui.actions.createRecipe.description,
            onClick: () => onNavigate('recipe', { mode: 'recipe' })
        },
        {
            icon: <Utensils size={32} />,
            title: MEAL_PLANNER_CONFIG.ui.actions.createMeal.title,
            description: MEAL_PLANNER_CONFIG.ui.actions.createMeal.description,
            onClick: () => onNavigate('recipe', { mode: 'meal' })
        },
        {
            icon: <Calendar size={32} />,
            title: MEAL_PLANNER_CONFIG.ui.actions.weeklyPlan.title,
            description: MEAL_PLANNER_CONFIG.ui.actions.weeklyPlan.description,
            onClick: () => onNavigate('planner', { inventoryBypassed: true })
        }
    ]

    return (
        <div className="container mx-auto px-6 py-16">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-4">
                        {MEAL_PLANNER_CONFIG.ui.welcomeMessage}
                    </h2>
                    <p className="text-white/60 text-sm uppercase tracking-widest font-bold">
                        Select an option below to get started
                    </p>
                </div>

                {hasReachedLimit && !isAdmin && (
                    <div className="mb-8 bg-red-500/10 border border-red-500/30 p-6 text-center max-w-2xl mx-auto">
                        <p className="text-red-400 font-bold mb-2">Monthly Limit Reached</p>
                        <p className="text-red-400/80 text-sm">
                            You've used all your requests for this month. The limit will reset at the start of next month.
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {actions.map((action, index) => (
                        <ActionCard
                            key={index}
                            {...action}
                            disabled={hasReachedLimit && !isAdmin}
                        />
                    ))}
                </div>

                {/* Beta Notice */}
                <div className="mt-16 text-center">
                    <div className="inline-block bg-white/5 border border-white/10 px-8 py-4 max-w-2xl">
                        <p className="text-white/40 text-xs uppercase tracking-widest font-bold mb-2">
                            {MEAL_PLANNER_CONFIG.ui.betaBadge}
                        </p>
                        <p className="text-white/60 text-sm">
                            This tool is in beta and currently free to use. Subscription pricing will be introduced upon full release.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
