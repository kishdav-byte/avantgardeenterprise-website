"use client"

import { useState } from 'react'
import { X } from 'lucide-react'

interface RecipeRequestModalProps {
    context: { day: string; mealType: string }
    initialValue: string
    onSave: (dish: string) => void
    onClose: () => void
}

export function RecipeRequestModal({ context, initialValue, onSave, onClose }: RecipeRequestModalProps) {
    const [dish, setDish] = useState(initialValue)

    const handleSave = () => {
        onSave(dish)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-background border border-white/10 p-8 max-w-md w-full mx-4">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-black uppercase tracking-tighter">
                        Request Specific Dish
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-white/60 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="mb-6">
                    <p className="text-white/60 text-sm mb-4">
                        <span className="text-accent font-bold">{context.day} {context.mealType}</span>
                    </p>
                    <label className="block text-white/80 font-bold uppercase tracking-wider text-xs mb-2">
                        Dish Name
                    </label>
                    <input
                        type="text"
                        value={dish}
                        onChange={(e) => setDish(e.target.value)}
                        placeholder="e.g., Chicken Parmesan"
                        className="w-full bg-white/5 border border-white/20 rounded-md p-3 text-white placeholder-white/40 focus:ring-2 focus:ring-accent focus:border-accent"
                        autoFocus
                    />
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={handleSave}
                        className="flex-1 px-6 py-3 bg-accent text-black font-black uppercase tracking-wider text-sm hover:bg-white transition-all"
                    >
                        Save
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-3 border border-white/20 text-white font-black uppercase tracking-wider text-sm hover:border-white transition-all"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )
}
