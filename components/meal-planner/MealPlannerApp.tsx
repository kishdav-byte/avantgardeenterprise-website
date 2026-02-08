"use client"

import { useState } from 'react'
import { MealPlannerLanding } from './MealPlannerLanding'
import { MealPlannerMain } from './MealPlannerMain'
import { RecipeFinder } from './RecipeFinder'
import { FavoritesView } from './FavoritesView'
import type { MealPlannerView } from '@/lib/meal-planner-types'

interface MealPlannerAppProps {
    userId: string
    isAdmin: boolean
    hasReachedLimit: boolean
}

export function MealPlannerApp({ userId, isAdmin, hasReachedLimit }: MealPlannerAppProps) {
    const [currentView, setCurrentView] = useState<MealPlannerView>('landing')
    const [recipeMode, setRecipeMode] = useState<'recipe' | 'meal'>('recipe')
    const [inventoryBypassed, setInventoryBypassed] = useState(false)

    const handleNavigate = (view: MealPlannerView, mode?: 'recipe' | 'meal') => {
        setCurrentView(view)
        if (mode) setRecipeMode(mode)
    }

    const handleToggleInventory = () => {
        setInventoryBypassed(!inventoryBypassed)
    }

    // Render based on current view
    if (currentView === 'landing') {
        return (
            <MealPlannerLanding
                onNavigate={handleNavigate}
                hasReachedLimit={hasReachedLimit}
                isAdmin={isAdmin}
            />
        )
    }

    if (currentView === 'planner') {
        return (
            <div>
                <button
                    onClick={() => setCurrentView('landing')}
                    className="mb-6 text-accent hover:text-white transition font-bold uppercase tracking-wider text-sm"
                >
                    ‹ Back to Menu
                </button>
                <MealPlannerMain
                    userId={userId}
                    isAdmin={isAdmin}
                    hasReachedLimit={hasReachedLimit}
                    inventoryBypassed={inventoryBypassed}
                    onToggleInventory={handleToggleInventory}
                />
            </div>
        )
    }

    if (currentView === 'recipe') {
        return (
            <div>
                <button
                    onClick={() => setCurrentView('landing')}
                    className="mb-6 text-accent hover:text-white transition font-bold uppercase tracking-wider text-sm"
                >
                    ‹ Back to Menu
                </button>
                <RecipeFinder
                    userId={userId}
                    isAdmin={isAdmin}
                    hasReachedLimit={hasReachedLimit}
                    mode={recipeMode}
                />
            </div>
        )
    }

    if (currentView === 'favorites') {
        return (
            <div>
                <button
                    onClick={() => setCurrentView('landing')}
                    className="mb-6 text-accent hover:text-white transition font-bold uppercase tracking-wider text-sm"
                >
                    ‹ Back to Menu
                </button>
                <FavoritesView userId={userId} />
            </div>
        )
    }

    return null
}
