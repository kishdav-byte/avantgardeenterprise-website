"use client"

export function FavoritesView({ userId }: any) {
    return (
        <div className="max-w-5xl mx-auto">
            <div className="bg-white/5 border border-white/10 p-12 text-center">
                <h2 className="text-3xl font-black uppercase tracking-tighter mb-4 text-accent">
                    Favorites - Coming Soon
                </h2>
                <p className="text-white/60 mb-6">
                    Your saved recipes will appear here.
                </p>
                <p className="text-white/40 text-sm">
                    Favorites will be stored in the meal_planner_favorites table.
                </p>
            </div>
        </div>
    )
}
