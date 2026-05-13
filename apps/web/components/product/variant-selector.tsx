'use client'

import { useState } from 'react'

interface VariantSelectorProps {
  label: string
  options: { label: string; value: string; selected?: boolean }[]
  onSelect?: (value: string) => void
}

export function VariantSelector({
  label,
  options,
  onSelect,
}: VariantSelectorProps) {
  const [selected, setSelected] = useState(
    options.find((opt) => opt.selected)?.value || options[0]?.value
  )

  const handleSelect = (value: string) => {
    setSelected(value)
    onSelect?.(value)
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-semibold text-foreground">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => handleSelect(option.value)}
            className={`cursor-pointer rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all duration-200 ${
              selected === option.value
                ? 'border-foreground bg-foreground text-background'
                : 'border-border bg-background text-foreground hover:border-foreground'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
