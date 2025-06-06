'use client'

interface OriginalValueDisplayProps {
  originalValue: string | null | undefined
  fieldType?: 'budget-type' | 'budget-amount' | 'date'
}

export function OriginalValueDisplay({ originalValue, fieldType }: OriginalValueDisplayProps) {
  if (!originalValue) return null

  const formatValue = (value: string, type?: string) => {
    switch (type) {
      case 'budget-type':
        return value === 'daily' ? 'Daily Budget' : 'Total Budget (Lifetime)'
      case 'budget-amount':
        return `$${value}`
      case 'date':
        try {
          return new Date(value).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })
        } catch {
          return value
        }
      default:
        return value
    }
  }

  return (
    <div className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-200 dark:bg-blue-950/20 dark:border-blue-800 dark:text-blue-300 mt-1">
      📝 Auto-completed: {formatValue(originalValue, fieldType)}
    </div>
  )
}