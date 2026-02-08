"use client"

import { Coffee, Sun, Moon, Pencil } from 'lucide-react'
import type { MealRequest } from '@/lib/meal-planner-types'

interface MealCalendarProps {
    mealSchedule: MealRequest[]
    onScheduleChange: (newSchedule: MealRequest[]) => void
    onOpenRecipeRequest: (day: string, mealType: string) => void
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MEAL_TYPES = [
    { name: 'Breakfast', Icon: Coffee },
    { name: 'Lunch', Icon: Sun },
    { name: 'Dinner', Icon: Moon }
]

export function MealCalendar({ mealSchedule, onScheduleChange, onOpenRecipeRequest }: MealCalendarProps) {
    const handleToggleMeal = (day: string, mealType: string) => {
        const existingIndex = mealSchedule.findIndex(m => m.day === day && m.mealType === mealType)
        if (existingIndex > -1) {
            onScheduleChange(mealSchedule.filter((_, i) => i !== existingIndex))
        } else {
            onScheduleChange([...mealSchedule, { day, mealType, servings: 2, specificDish: '' }])
        }
    }

    const handleChangeServings = (day: string, mealType: string, newServings: number) => {
        onScheduleChange(mealSchedule.map(m =>
            (m.day === day && m.mealType === mealType)
                ? { ...m, servings: Math.max(1, parseInt(String(newServings), 10) || 1) }
                : m
        ))
    }

    return (
        <div className="bg-white/5 p-4 md:p-6 rounded-lg border border-white/10">
            <div className="grid grid-cols-4 lg:grid-cols-8 gap-1">
                <div className="hidden lg:flex items-end justify-center pb-2">
                    <span className="text-white/40 text-xs font-black uppercase tracking-widest">Meals</span>
                </div>
                {DAYS_OF_WEEK.map(day => (
                    <div key={day} className="text-center font-black uppercase tracking-wider text-white/80 py-2 col-span-1 text-xs">
                        {day.substring(0, 3)}
                    </div>
                ))}
            </div>
            <div className="space-y-1">
                {MEAL_TYPES.map(({ name, Icon }) => (
                    <div key={name} className="grid grid-cols-4 lg:grid-cols-8 gap-1 items-stretch">
                        <div className="flex items-center gap-2 p-2 justify-start col-span-4 lg:col-span-1">
                            <Icon className="w-5 h-5 text-accent" />
                            <span className="font-black uppercase tracking-wider text-white/80 text-sm">{name}</span>
                        </div>
                        {DAYS_OF_WEEK.map(day => {
                            const meal = mealSchedule.find(m => m.day === day && m.mealType === name)
                            const isSelected = !!meal

                            return (
                                <div key={`${day}-${name}`} className="h-full col-span-1">
                                    <button
                                        onClick={() => handleToggleMeal(day, name)}
                                        className={`w-full h-full p-2 rounded-md transition-all duration-200 flex flex-col items-center justify-center text-center min-h-[100px] ${isSelected ? 'bg-accent/20 border border-accent/30' : 'bg-white/5 hover:bg-white/10 border border-white/10'
                                            }`}
                                    >
                                        {isSelected ? (
                                            <div className="w-full space-y-2 py-2 flex flex-col justify-between h-full">
                                                <div>
                                                    <label htmlFor={`servings-${day}-${name}`} className="text-xs font-bold uppercase tracking-wider text-accent">
                                                        Servings
                                                    </label>
                                                    <input
                                                        type="number"
                                                        id={`servings-${day}-${name}`}
                                                        value={meal.servings}
                                                        onClick={(e) => e.stopPropagation()}
                                                        onChange={(e) => handleChangeServings(day, name, Number(e.target.value))}
                                                        min="1"
                                                        className="w-full bg-black/50 border text-center border-white/20 rounded-md p-1 text-white focus:ring-1 focus:ring-accent focus:border-accent"
                                                    />
                                                </div>
                                                <div className="border-t border-white/10 my-2"></div>
                                                {meal.specificDish ? (
                                                    <div className="text-left w-full">
                                                        <p className="text-xs text-white/40 mb-1 uppercase tracking-wider font-bold">Requested:</p>
                                                        <p className="text-sm font-bold text-accent truncate mb-1">{meal.specificDish}</p>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); onOpenRecipeRequest(day, name); }}
                                                            className="text-xs text-white/60 hover:text-accent font-bold flex items-center gap-1 uppercase tracking-wider"
                                                        >
                                                            <Pencil className="w-3 h-3" /> Edit
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onOpenRecipeRequest(day, name); }}
                                                        className="w-full text-xs text-white/60 hover:text-accent transition-colors p-1 rounded-md bg-white/5 hover:bg-white/10 font-bold uppercase tracking-wider"
                                                    >
                                                        + Add Request
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="w-4 h-4 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors"></div>
                                        )}
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                ))}
            </div>
        </div>
    )
}
