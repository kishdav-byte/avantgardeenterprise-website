/**
 * Type definitions for the Meal Planner tool
 */

export interface MealRequest {
    day: string
    mealType: string
    servings: number
    specificDish?: string
}

export interface Meal {
    day: string
    mealType: string
    recipeName: string
    servings: number
    ingredients: string[]
    instructions: string[]
}

export interface MealPlanResponse {
    meals: Meal[]
    shoppingList: string[]
    totalEstimatedCost?: string
    prepTips?: string[]
}

export interface SingleRecipeResponse {
    recipeName: string
    servings: number
    prepTime?: string
    cookTime?: string
    ingredients: string[]
    instructions: string[]
    nutritionInfo?: {
        calories?: string
        protein?: string
        carbs?: string
        fat?: string
    }
}

export interface FavoriteRecipe {
    id: string
    recipeName: string
    ingredients: string[]
    instructions: string[]
    created_at?: string
}

export interface ImageFile {
    file: File
    preview: string
}

export interface UsageStats {
    total_requests: number
    monthly_requests: number
    monthly_limit: number
    subscription_status: string
    is_admin: boolean
}

export interface UserProfile {
    id: string
    email: string
    first_name?: string
    last_name?: string
    role: string
}

export type View = 'landing' | 'planner' | 'recipeFinder' | 'favorites'
