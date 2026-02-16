"use client"

import { useState } from 'react'
import { Loader2, Search, Sparkles, Heart, Plus, Minus, Camera, Printer } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { ImageUploader } from './ImageUploader'
import { PreferenceSelector } from './PreferenceSelector'
import { DIETARY_PREFERENCES } from '@/lib/meal-planner-config'
import type { SingleRecipeResponse } from '@/lib/meal-planner-types'

interface RecipeFinderProps {
    userId: string
    isAdmin: boolean
    hasReachedLimit: boolean
    mode: 'recipe' | 'meal'
}

interface ImageFile {
    file: File
    base64: string
}

export function RecipeFinder({ userId, isAdmin, hasReachedLimit, mode }: RecipeFinderProps) {
    const [query, setQuery] = useState('')
    const [servings, setServings] = useState(2)
    const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([])
    const [fridgeImage, setFridgeImage] = useState<ImageFile | null>(null)
    const [pantryImage, setPantryImage] = useState<ImageFile | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [recipe, setRecipe] = useState<SingleRecipeResponse | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [saveSuccess, setSaveSuccess] = useState(false)
    const [showImageUpload, setShowImageUpload] = useState(false)

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!query && !fridgeImage && !pantryImage) {
            setError('Please describe what you want or upload ingredient images.')
            return
        }

        setIsLoading(true)
        setError(null)
        setRecipe(null)
        setSaveSuccess(false)

        try {
            const requestData: any = {
                action: mode === 'recipe' ? 'single_recipe' : 'meal_recipe',
                query: query || (showImageUpload ? "Suggest a recipe based on these ingredients" : ""),
                servings,
                dietaryPreferences
            }

            if (fridgeImage) {
                requestData.fridgeImage = {
                    mimeType: fridgeImage.file.type,
                    data: fridgeImage.base64
                }
            }
            if (pantryImage) {
                requestData.pantryImage = {
                    mimeType: pantryImage.file.type,
                    data: pantryImage.base64
                }
            }

            const response = await fetch('/api/meal-planner', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to find recipe')
            }

            const result = await response.json()
            setRecipe(result)
        } catch (e: any) {
            console.error(e)
            setError(e.message || 'An error occurred searching for recipes.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSaveFavorite = async () => {
        if (!recipe || !userId || isSaving) return

        setIsSaving(true)
        try {
            const { error: saveError } = await supabase
                .from('meal_planner_favorites')
                .insert({
                    user_id: userId,
                    recipe_name: recipe.recipeName,
                    ingredients: recipe.ingredients,
                    instructions: recipe.instructions,
                    nutrition_info: recipe.nutritionInfo || {},
                    prep_time: recipe.prepTime,
                    cook_time: recipe.cookTime,
                    servings: recipe.servings
                })

            if (saveError) throw saveError
            setSaveSuccess(true)
        } catch (e: any) {
            console.error(e)
            setError("Failed to save to favorites.")
        } finally {
            setIsSaving(false)
        }
    }

    const handlePrint = () => {
        window.print()
    }

    const incrementServings = () => setServings(prev => Math.min(prev + 1, 12))
    const decrementServings = () => setServings(prev => Math.max(prev - 1, 1))

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-32">
            {/* Search Input Card */}
            <div className="bg-white/5 border border-white/10 p-8">
                <form onSubmit={handleSearch} className="space-y-6">
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter text-accent mb-4">
                            {mode === 'recipe' ? 'Find a Recipe' : 'Plan a Complete Meal'}
                        </h2>

                        <div className="relative group">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={mode === 'recipe' ? "e.g. Healthy Salmon Pasta or Chicken Marsala" : "e.g. A romantic Italian dinner for two"}
                                className="w-full bg-white/5 border border-white/10 rounded-sm px-6 py-4 text-white placeholder:text-white/20 focus:border-accent focus:outline-none transition-all group-hover:border-white/20 font-medium"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setShowImageUpload(!showImageUpload)}
                                    className={`p-2 transition-colors ${showImageUpload ? 'text-accent' : 'text-white/40 hover:text-white'}`}
                                    title="Add ingredient images"
                                >
                                    <Camera size={20} />
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading || hasReachedLimit}
                                    className="p-2 text-accent hover:text-white transition-colors disabled:opacity-50"
                                >
                                    <Search size={24} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Image Upload section (Optional) */}
                    {showImageUpload && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white/5 rounded-sm border border-white/10 border-dashed animate-in fade-in slide-in-from-top-4 duration-300">
                            <ImageUploader label="Fridge" onImageUpload={setFridgeImage} />
                            <ImageUploader label="Pantry" onImageUpload={setPantryImage} />
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                        {/* Servings */}
                        <div>
                            <h3 className="font-black uppercase tracking-wider text-white/80 mb-4 text-sm">Target Servings</h3>
                            <div className="flex items-center gap-6">
                                <button
                                    type="button"
                                    onClick={decrementServings}
                                    className="w-10 h-10 border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors"
                                >
                                    <Minus size={16} />
                                </button>
                                <span className="text-2xl font-black tracking-tighter w-8 text-center">{servings}</span>
                                <button
                                    type="button"
                                    onClick={incrementServings}
                                    className="w-10 h-10 border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Dietary Preferences */}
                        <PreferenceSelector
                            label="Dietary Restrictions"
                            options={DIETARY_PREFERENCES}
                            selectedOptions={dietaryPreferences}
                            onChange={setDietaryPreferences}
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <button
                            type="submit"
                            disabled={isLoading || hasReachedLimit}
                            className="flex-1 bg-accent text-black font-black uppercase tracking-widest py-4 hover:bg-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : <Search size={18} />}
                            {mode === 'recipe' ? 'Find Recipe' : 'Generate Meal'}
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSearch()}
                            disabled={isLoading || hasReachedLimit}
                            className="px-8 py-4 border border-white/10 text-white font-black uppercase tracking-widest hover:border-accent hover:text-accent transition-all flex items-center justify-center gap-2"
                        >
                            <Sparkles size={18} />
                            AI Recommendation
                        </button>
                    </div>
                </form>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-6 font-bold uppercase tracking-wider text-sm text-center">
                    {error}
                </div>
            )}

            {/* Result Display */}
            {isLoading && !recipe && (
                <div className="py-20 text-center">
                    <Loader2 className="w-16 h-16 text-accent animate-spin mx-auto mb-6" />
                    <p className="text-white font-black uppercase tracking-[0.2em]">Engaging Culinary Neural Network...</p>
                </div>
            )}

            {recipe && (
                <div className="bg-white/5 border border-white/10 p-8 md:p-12 animate-in fade-in zoom-in-95 duration-500">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                        <div>
                            <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white mb-2 leading-none">
                                {recipe.recipeName}
                            </h3>
                            <div className="flex flex-wrap items-center gap-4 text-xs font-bold uppercase tracking-[0.2em] text-white/40 mt-4">
                                <span>{recipe.servings} Servings</span>
                                {recipe.prepTime && (
                                    <>
                                        <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                                        <span>Prep: {recipe.prepTime}</span>
                                    </>
                                )}
                                {recipe.cookTime && (
                                    <>
                                        <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                                        <span>Cook: {recipe.cookTime}</span>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 px-6 py-3 border border-white/10 text-white hover:border-accent hover:text-accent transition-all uppercase font-black tracking-widest text-xs"
                            >
                                <Printer size={16} />
                                Print
                            </button>
                            <button
                                onClick={handleSaveFavorite}
                                disabled={isSaving || saveSuccess}
                                className={`flex items-center gap-2 px-6 py-3 border transition-all uppercase font-black tracking-widest text-xs ${saveSuccess
                                    ? 'bg-accent/20 border-accent/40 text-accent'
                                    : 'border-white/10 text-white hover:border-accent hover:text-accent'
                                    }`}
                            >
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Heart size={16} className={saveSuccess ? 'fill-accent' : ''} />}
                                {saveSuccess ? 'Saved' : 'Save Favorite'}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Ingredients */}
                        <div>
                            <h4 className="text-xl font-black uppercase tracking-wider text-accent mb-6 flex items-center gap-3">
                                <span className="w-8 h-px bg-accent/30"></span>
                                Ingredients
                            </h4>
                            <ul className="space-y-4">
                                {recipe.ingredients.map((ing, i) => (
                                    <li key={i} className="flex items-start gap-3 text-white/70 group">
                                        <div className="mt-1.5 w-1.5 h-1.5 bg-accent/30 rounded-full group-hover:bg-accent transition-colors"></div>
                                        <span className="text-lg leading-snug">{ing}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Instructions */}
                        <div>
                            <h4 className="text-xl font-black uppercase tracking-wider text-accent mb-6 flex items-center gap-3">
                                <span className="w-8 h-px bg-accent/30"></span>
                                Instructions
                            </h4>
                            <ol className="space-y-8">
                                {recipe.instructions.map((inst, i) => (
                                    <li key={i} className="flex gap-6 group">
                                        <span className="text-3xl font-black text-white/10 group-hover:text-accent/20 transition-colors leading-none">
                                            {(i + 1).toString().padStart(2, '0')}
                                        </span>
                                        <p className="text-lg text-white/70 leading-relaxed font-medium pt-1">
                                            {inst}
                                        </p>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </div>

                    {/* Nutrition Footer */}
                    {recipe.nutritionInfo && Object.keys(recipe.nutritionInfo).length > 0 && (
                        <div className="mt-16 pt-8 border-t border-white/10">
                            <h4 className="text-sm font-black uppercase tracking-[0.3em] text-white/30 mb-6">Nutrition Profile</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                {Object.entries(recipe.nutritionInfo).map(([key, val]) => (
                                    <div key={key}>
                                        <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">{key}</p>
                                        <p className="text-xl font-black text-white uppercase">{val as string}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    nav, footer, .border-b, button, .bg-white\/5.p-8, form {
                        display: none !important;
                    }
                    body {
                        background: white !important;
                        color: black !important;
                    }
                    .bg-white\/5 {
                        background: transparent !important;
                        border: none !important;
                        padding: 0 !important;
                    }
                    .text-white, .text-white\/40, .text-white\/70 {
                        color: black !important;
                    }
                    .text-accent {
                        color: #000 !important;
                        text-decoration: underline;
                    }
                    .animate-in {
                        animation: none !important;
                        opacity: 1 !important;
                        transform: none !important;
                    }
                }
            `}</style>
        </div>
    )
}
