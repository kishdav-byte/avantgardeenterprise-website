"use client"

import { useState, useCallback } from 'react'
import { ImageUploader } from './ImageUploader'
import { PreferenceSelector } from './PreferenceSelector'
import { MealCalendar } from './MealCalendar'
import { RecipeRequestModal } from './RecipeRequestModal'
import { Loader2 } from 'lucide-react'
import { DIETARY_PREFERENCES, CUISINE_PREFERENCES } from '@/lib/meal-planner-config'
import type { MealRequest, MealPlanResponse } from '@/lib/meal-planner-types'

interface MealPlannerMainProps {
    userId: string
    isAdmin: boolean
    hasReachedLimit: boolean
    inventoryBypassed: boolean
    onToggleInventory: () => void
}

interface ImageFile {
    file: File
    base64: string
}

export function MealPlannerMain({
    userId,
    isAdmin,
    hasReachedLimit,
    inventoryBypassed,
    onToggleInventory
}: MealPlannerMainProps) {
    const [fridgeImage, setFridgeImage] = useState<ImageFile | null>(null)
    const [pantryImage, setPantryImage] = useState<ImageFile | null>(null)
    const [spiceImage, setSpiceImage] = useState<ImageFile | null>(null)
    const [mealSchedule, setMealSchedule] = useState<MealRequest[]>([])
    const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([])
    const [cuisinePreferences, setCuisinePreferences] = useState<string[]>([])
    const [mealPlan, setMealPlan] = useState<MealPlanResponse | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [recipeRequestContext, setRecipeRequestContext] = useState<{ day: string; mealType: string } | null>(null)

    const handleOpenRecipeRequest = (day: string, mealType: string) => {
        setRecipeRequestContext({ day, mealType })
    }

    const handleCloseRecipeRequest = () => {
        setRecipeRequestContext(null)
    }

    const handleSaveSpecificDish = (dish: string) => {
        if (!recipeRequestContext) return

        const { day, mealType } = recipeRequestContext
        setMealSchedule(mealSchedule.map(m =>
            (m.day === day && m.mealType === mealType)
                ? { ...m, specificDish: dish }
                : m
        ))
        handleCloseRecipeRequest()
    }

    const handleGeneratePlan = useCallback(async () => {
        if (!inventoryBypassed && (!fridgeImage || !pantryImage || !spiceImage)) {
            setError('Please upload all three images or bypass inventory to generate a meal plan.')
            return
        }
        if (mealSchedule.length === 0) {
            setError('Please add at least one meal to the calendar.')
            return
        }

        setIsLoading(true)
        setError(null)
        setMealPlan(null)

        try {
            const requestData: any = {
                action: 'meal_plan',
                mealSchedule,
                dietaryPreferences,
                cuisinePreferences
            }

            // Add images if not bypassed
            if (!inventoryBypassed && fridgeImage && pantryImage && spiceImage) {
                requestData.fridgeImage = {
                    mimeType: fridgeImage.file.type,
                    data: fridgeImage.base64
                }
                requestData.pantryImage = {
                    mimeType: pantryImage.file.type,
                    data: pantryImage.base64
                }
                requestData.spiceImage = {
                    mimeType: spiceImage.file.type,
                    data: spiceImage.base64
                }
            }

            const response = await fetch('/api/meal-planner', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to generate meal plan')
            }

            const plan = await response.json()
            setMealPlan(plan)
        } catch (e: any) {
            console.error(e)
            setError(e.message || 'An unknown error occurred.')
        } finally {
            setIsLoading(false)
        }
    }, [inventoryBypassed, fridgeImage, pantryImage, spiceImage, mealSchedule, dietaryPreferences, cuisinePreferences])

    const isGenerateButtonDisabled =
        isLoading ||
        hasReachedLimit ||
        mealSchedule.length === 0 ||
        (!inventoryBypassed && (!fridgeImage || !pantryImage || !spiceImage))

    const currentRecipeRequest = recipeRequestContext
        ? mealSchedule.find(m => m.day === recipeRequestContext.day && m.mealType === recipeRequestContext.mealType)
        : null

    return (
        <div className="max-w-6xl mx-auto space-y-12">
            {/* Inventory Section */}
            <div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-accent">
                        {inventoryBypassed ? '1. Inventory Skipped' : '1. Upload Your Inventory'}
                    </h2>
                    <button
                        onClick={onToggleInventory}
                        className="text-sm text-accent hover:text-white transition font-bold uppercase tracking-wider mt-2 sm:mt-0 self-start sm:self-center"
                    >
                        {inventoryBypassed ? '‹ Use My Inventory Instead' : 'Bypass & Find Recipes ›'}
                    </button>
                </div>
                <p className="text-white/60 mb-6">
                    {inventoryBypassed
                        ? 'AI will suggest recipes based only on your preferences and schedule.'
                        : "Take a clear picture of what's inside your fridge, pantry, and your spice rack."}
                </p>
                {!inventoryBypassed && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <ImageUploader label="Fridge" onImageUpload={setFridgeImage} />
                        <ImageUploader label="Pantry" onImageUpload={setPantryImage} />
                        <ImageUploader label="Spice Rack" onImageUpload={setSpiceImage} />
                    </div>
                )}
            </div>

            {/* Calendar Section */}
            <div>
                <h2 className="text-3xl font-black uppercase tracking-tighter text-accent mb-4">2. Plan Your Week</h2>
                <p className="text-white/60 mb-6">Select the meals you want to plan for the week and how many servings for each.</p>
                <MealCalendar
                    mealSchedule={mealSchedule}
                    onScheduleChange={setMealSchedule}
                    onOpenRecipeRequest={handleOpenRecipeRequest}
                />
            </div>

            {/* Preferences Section */}
            <div>
                <h2 className="text-3xl font-black uppercase tracking-tighter text-accent mb-4">3. Set Your Preferences</h2>
                <p className="text-white/60 mb-6">Let us know your dietary needs and preferred cuisines.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <PreferenceSelector
                        label="Dietary Needs"
                        options={DIETARY_PREFERENCES}
                        selectedOptions={dietaryPreferences}
                        onChange={setDietaryPreferences}
                        isMultiSelect={true}
                    />
                    <PreferenceSelector
                        label="Cuisine Preferences"
                        options={CUISINE_PREFERENCES}
                        selectedOptions={cuisinePreferences}
                        onChange={setCuisinePreferences}
                        isMultiSelect={true}
                    />
                </div>
            </div>

            {/* Generate Button */}
            <div className="text-center">
                <button
                    onClick={handleGeneratePlan}
                    disabled={isGenerateButtonDisabled}
                    className={`w-full md:w-1/2 lg:w-1/3 px-8 py-4 bg-accent text-black font-black text-lg uppercase tracking-wider shadow-lg hover:bg-white transition-all duration-300 transform hover:scale-105 disabled:bg-white/20 disabled:text-white/40 disabled:cursor-not-allowed disabled:transform-none ${isLoading ? 'animate-pulse' : ''
                        }`}
                >
                    {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            AI is thinking...
                        </span>
                    ) : (
                        'Generate My Meal Plan'
                    )}
                </button>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 text-center font-bold uppercase tracking-wider text-sm">
                    {error}
                </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
                    <p className="text-white/60 text-sm uppercase tracking-widest font-bold">Generating your meal plan...</p>
                </div>
            )}

            {/* Meal Plan Display */}
            {mealPlan && (
                <div className="bg-white/5 border border-white/10 p-8">
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-accent mb-6">Your Meal Plan</h2>

                    {/* Meals */}
                    <div className="space-y-6 mb-8">
                        {mealPlan.meals.map((meal, index) => (
                            <div key={index} className="bg-white/5 border border-white/10 p-6">
                                <h3 className="text-xl font-black uppercase tracking-wider text-white mb-2">
                                    {meal.day} - {meal.mealType}
                                </h3>
                                <p className="text-accent font-bold mb-4">{meal.recipeName}</p>
                                <p className="text-white/60 text-sm mb-4">Servings: {meal.servings}</p>

                                <div className="mb-4">
                                    <h4 className="font-black uppercase tracking-wider text-sm text-white/80 mb-2">Ingredients:</h4>
                                    <ul className="list-disc list-inside text-white/60 text-sm space-y-1">
                                        {meal.ingredients.map((ing, i) => (
                                            <li key={i}>{ing}</li>
                                        ))}
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="font-black uppercase tracking-wider text-sm text-white/80 mb-2">Instructions:</h4>
                                    <ol className="list-decimal list-inside text-white/60 text-sm space-y-1">
                                        {meal.instructions.map((inst, i) => (
                                            <li key={i}>{inst}</li>
                                        ))}
                                    </ol>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Shopping List */}
                    {mealPlan.shoppingList && mealPlan.shoppingList.length > 0 && (
                        <div className="bg-white/5 border border-white/10 p-6 mb-6">
                            <h3 className="text-xl font-black uppercase tracking-wider text-accent mb-4">Shopping List</h3>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-white/60 text-sm">
                                {mealPlan.shoppingList.map((item, i) => (
                                    <li key={i} className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-accent rounded-full"></span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Estimated Cost */}
                    {mealPlan.totalEstimatedCost && (
                        <p className="text-white/60 text-sm mb-4">
                            <span className="font-bold text-white">Estimated Cost:</span> {mealPlan.totalEstimatedCost}
                        </p>
                    )}

                    {/* Prep Tips */}
                    {mealPlan.prepTips && mealPlan.prepTips.length > 0 && (
                        <div className="bg-accent/10 border border-accent/30 p-4">
                            <h4 className="font-black uppercase tracking-wider text-sm text-accent mb-2">Prep Tips:</h4>
                            <ul className="list-disc list-inside text-white/60 text-sm space-y-1">
                                {mealPlan.prepTips.map((tip, i) => (
                                    <li key={i}>{tip}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* Recipe Request Modal */}
            {recipeRequestContext && currentRecipeRequest && (
                <RecipeRequestModal
                    context={recipeRequestContext}
                    initialValue={currentRecipeRequest.specificDish || ''}
                    onSave={handleSaveSpecificDish}
                    onClose={handleCloseRecipeRequest}
                />
            )}
        </div>
    )
}
