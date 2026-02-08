"use client"

export function RecipeFinder({ userId, isAdmin, hasReachedLimit, mode }: any) {
    return (
        <div className="max-w-5xl mx-auto">
            <div className="bg-white/5 border border-white/10 p-12 text-center">
                <h2 className="text-3xl font-black uppercase tracking-tighter mb-4 text-accent">
                    Recipe Finder - Coming Soon
                </h2>
                <p className="text-white/60 mb-6">
                    Mode: <span className="text-accent font-bold">{mode === 'recipe' ? 'Single Recipe' : 'Full Meal'}</span>
                </p>
                <p className="text-white/40 text-sm">
                    This will allow users to search for specific recipes or complete meals using AI.
                </p>
            </div>
        </div>
    )
}
