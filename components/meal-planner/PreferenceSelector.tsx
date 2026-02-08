"use client"

interface PreferenceSelectorProps {
    label: string
    options: string[]
    selectedOptions: string[]
    onChange: (selected: string[]) => void
    isMultiSelect?: boolean
}

export function PreferenceSelector({
    label,
    options,
    selectedOptions,
    onChange,
    isMultiSelect = true,
}: PreferenceSelectorProps) {
    const handleSelect = (option: string) => {
        if (isMultiSelect) {
            const newSelection = selectedOptions.includes(option)
                ? selectedOptions.filter((item) => item !== option)
                : [...selectedOptions, option]
            onChange(newSelection)
        } else {
            onChange([option])
        }
    }

    return (
        <div>
            <h3 className="font-black uppercase tracking-wider text-white/80 mb-4 text-sm">{label}</h3>
            <div className="flex flex-wrap gap-2">
                {options.map((option) => {
                    const isSelected = selectedOptions.includes(option)
                    return (
                        <button
                            key={option}
                            onClick={() => handleSelect(option)}
                            className={`px-4 py-2 text-sm font-bold uppercase tracking-wider rounded-sm border transition-all duration-200 ${isSelected
                                    ? 'bg-accent border-accent text-black'
                                    : 'bg-white/5 border-white/20 text-white/80 hover:bg-white/10 hover:border-white/40'
                                }`}
                        >
                            {option}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
