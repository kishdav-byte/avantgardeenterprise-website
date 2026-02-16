"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Loader2, Trash2, ChevronRight, Clock, Users, X, Printer } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface FavoritesViewProps {
    userId: string
}

export function FavoritesView({ userId }: FavoritesViewProps) {
    const [favorites, setFavorites] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedRecipe, setSelectedRecipe] = useState<any | null>(null)

    useEffect(() => {
        fetchFavorites()
    }, [userId])

    async function fetchFavorites() {
        setIsLoading(true)
        try {
            const { data, error: fetchError } = await supabase
                .from('meal_planner_favorites')
                .select('*')
                .order('created_at', { ascending: false })

            if (fetchError) throw fetchError
            setFavorites(data || [])
        } catch (e: any) {
            console.error(e)
            setError(e.message || "Failed to load favorites.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        if (!confirm("Are you sure you want to remove this recipe from your favorites?")) return

        try {
            const { error: deleteError } = await supabase
                .from('meal_planner_favorites')
                .delete()
                .eq('id', id)

            if (deleteError) throw deleteError
            setFavorites(favorites.filter(f => f.id !== id))
        } catch (e: any) {
            console.error(e)
            alert("Failed to delete favorite.")
        }
    }

    const handlePrint = () => {
        window.print()
    }

    if (isLoading) {
        return (
            <div className="py-20 text-center">
                <Loader2 className="w-12 h-12 text-accent animate-spin mx-auto mb-4" />
                <p className="text-white/40 uppercase tracking-widest text-xs font-bold font-black">Retrieving Culinary Archive...</p>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-32">
            <div className="flex justify-between items-center mb-12">
                <h2 className="text-4xl font-black uppercase tracking-tighter text-white">
                    Favorite <span className="text-accent">Recipes</span>
                </h2>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 px-4 py-2 border border-white/5 bg-white/5">
                    {favorites.length} Saved Items
                </div>
            </div>

            {error && (
                <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold uppercase tracking-wider text-center">
                    {error}
                </div>
            )}

            {favorites.length === 0 ? (
                <div className="bg-white/5 border border-white/10 p-20 text-center">
                    <p className="text-white/40 uppercase tracking-[0.2em] font-black mb-2 leading-none">Your archive is empty</p>
                    <p className="text-white/20 text-xs italic uppercase">Heart a recipe to save it here for future reference.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {favorites.map((recipe) => (
                        <motion.div
                            key={recipe.id}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.02 }}
                            onClick={() => setSelectedRecipe(recipe)}
                            className="bg-white/5 border border-white/10 p-6 cursor-pointer group hover:border-accent/30 transition-all relative overflow-hidden"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-black uppercase tracking-tight text-white group-hover:text-accent transition-colors leading-tight pr-8">
                                    {recipe.recipe_name}
                                </h3>
                                <button
                                    onClick={(e) => handleDelete(e, recipe.id)}
                                    className="p-2 text-white/20 hover:text-red-500 transition-colors"
                                    title="Unfavorite"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-widest text-white/40">
                                <span className="flex items-center gap-1"><Users size={12} /> {recipe.servings} SVGS</span>
                                {recipe.prep_time && <span className="flex items-center gap-1"><Clock size={12} /> {recipe.prep_time}</span>}
                            </div>

                            <div className="mt-6 flex items-center justify-between">
                                <span className="text-[9px] text-accent/50 group-hover:text-accent transition-colors font-black uppercase tracking-[0.3em]">View Full Details</span>
                                <ChevronRight className="text-white/20 group-hover:text-accent transform group-hover:translate-x-1 transition-all" size={18} />
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Recipe Modal */}
            <AnimatePresence>
                {selectedRecipe && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-neutral-900 border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                        >
                            <div className="sticky top-0 bg-neutral-900 z-10 px-8 py-6 border-b border-white/5 flex justify-between items-start">
                                <div>
                                    <h3 className="text-3xl font-black uppercase tracking-tighter text-white">
                                        {selectedRecipe.recipe_name}
                                    </h3>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent mt-2">Favorite Recipe Entry</p>
                                </div>
                                <div className="flex gap-4">
                                    <button
                                        onClick={handlePrint}
                                        className="p-2 border border-white/10 hover:border-accent text-white/60 hover:text-accent transition-all flex items-center gap-2 px-4 text-xs font-black uppercase tracking-widest"
                                    >
                                        <Printer size={18} />
                                        Print
                                    </button>
                                    <button
                                        onClick={() => setSelectedRecipe(null)}
                                        className="p-2 border border-white/10 hover:border-accent text-white/60 hover:text-accent transition-all"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-8 md:p-12">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div>
                                        <h4 className="text-lg font-black uppercase tracking-widest text-accent mb-6 flex items-center gap-3">
                                            <span className="w-8 h-px bg-accent/30"></span>
                                            Ingredients
                                        </h4>
                                        <ul className="space-y-4">
                                            {selectedRecipe.ingredients.map((ing: string, i: number) => (
                                                <li key={i} className="flex items-start gap-3 text-white/70">
                                                    <div className="mt-1.5 w-1.5 h-1.5 bg-accent/30 rounded-full"></div>
                                                    <span className="text-lg leading-snug">{ing}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div>
                                        <h4 className="text-lg font-black uppercase tracking-widest text-accent mb-6 flex items-center gap-3">
                                            <span className="w-8 h-px bg-accent/30"></span>
                                            Instructions
                                        </h4>
                                        <ol className="space-y-8">
                                            {selectedRecipe.instructions.map((inst: string, i: number) => (
                                                <li key={i} className="flex gap-6 group">
                                                    <span className="text-3xl font-black text-white/10 leading-none">
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

                                {selectedRecipe.nutrition_info && Object.keys(selectedRecipe.nutrition_info).length > 0 && (
                                    <div className="mt-16 pt-8 border-t border-white/5">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-8">Nutrition Facts</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                            {Object.entries(selectedRecipe.nutrition_info).map(([key, val]) => (
                                                <div key={key}>
                                                    <p className="text-[9px] uppercase tracking-widest text-white/40 font-black mb-1 leading-none">{key}</p>
                                                    <p className="text-xl font-black text-white uppercase">{val as string}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    nav, footer, .border-b, button, .max-w-5xl > div:first-child, .grid {
                        display: none !important;
                    }
                    .fixed.inset-0 {
                        position: relative !important;
                        background: white !important;
                        display: block !important;
                        paddding: 0 !important;
                    }
                    .max-h-\[90vh\] {
                        max-height: none !important;
                        overflow: visible !important;
                    }
                    .bg-neutral-900 {
                        background: white !important;
                        color: black !important;
                    }
                    .text-white, .text-white\/70, .text-white\/40 {
                        color: black !important;
                    }
                    .text-accent {
                        color: black !important;
                        text-decoration: underline !important;
                    }
                    .border, .border-white\/10, .border-white\/5 {
                        border-color: #eee !important;
                    }
                    body {
                        background: white !important;
                    }
                }
            `}</style>
        </div>
    )
}
