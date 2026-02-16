/**
 * Meal Planner Tool Configuration
 * 
 * This file contains all branding and configuration for the meal planning tool.
 * Update these values to rebrand the tool without touching component code.
 */

export const MEAL_PLANNER_CONFIG = {
    // Branding
    name: "ButlerAI",
    shortName: "ButlerAI",
    tagline: "Your AI-Powered Culinary Assistant",
    description: "Transform your kitchen inventory into personalized weekly meal plans",

    // Status
    status: "beta" as const,
    isFree: true,

    // Limits (for non-admin users)
    limits: {
        monthlyRequests: 50,
        betaMonthlyRequests: 50,
    },

    // Features
    features: {
        inventoryUpload: true,
        weeklyPlanning: true,
        recipeFinder: true,
        favorites: true,
        dietaryPreferences: true,
        cuisinePreferences: true,
    },

    // UI Text
    ui: {
        welcomeMessage: "What would you like to do today?",
        betaBadge: "Beta - Free During Testing",
        limitWarning: "You've reached your monthly limit. Upgrade for unlimited access.",
        adminBadge: "Unlimited Access",
        loginRequired: "Please sign in to use this tool",

        // Action buttons
        actions: {
            uploadInventory: {
                title: "Upload Inventory",
                description: "Get a meal plan based on what you already have in your kitchen."
            },
            createRecipe: {
                title: "Create a Recipe",
                description: "Look up a specific recipe for a single dish."
            },
            createMeal: {
                title: "Create a Meal",
                description: "Get recipe ideas for a complete meal."
            },
            weeklyPlan: {
                title: "Create Weekly Meal Plan",
                description: "Generate a fresh 7-day meal plan and shopping list from scratch."
            }
        }
    },

    // API Configuration
    api: {
        endpoint: "/api/meal-planner",
        timeout: 60000, // 60 seconds
    }
} as const

// Dietary preferences options
export const DIETARY_PREFERENCES = [
    "Vegetarian",
    "Vegan",
    "Gluten-Free",
    "Dairy-Free",
    "Nut-Free",
    "Low-Carb",
    "Keto",
    "Paleo",
    "Halal",
    "Kosher",
    "Galveston",
]

// Cuisine preferences options
export const CUISINE_PREFERENCES = [
    "Italian",
    "Mexican",
    "Chinese",
    "Japanese",
    "Indian",
    "Thai",
    "Mediterranean",
    "American",
    "French",
    "Korean",
    "Greek",
    "Middle Eastern",
]

// Type exports
export type MealPlannerStatus = typeof MEAL_PLANNER_CONFIG.status
export type ActionType = 'meal_plan' | 'single_recipe' | 'meal_recipe'
