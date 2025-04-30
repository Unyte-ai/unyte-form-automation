'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { toast } from 'sonner'
import { generateUniqueEmail } from '@/app/actions/email'

interface GenerateEmailProps {
  onEmailGenerated?: (email: string) => void
  className?: string
}

export function GenerateEmail({ onEmailGenerated, className }: GenerateEmailProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateEmail = async () => {
    if (isGenerating) return
    
    try {
      setIsGenerating(true)
      
      // Call our server action to generate a unique email
      const uniqueEmail = await generateUniqueEmail()
      
      if (onEmailGenerated) {
        onEmailGenerated(uniqueEmail)
        toast.success("Email generated", {
          description: "Your unique form submission email has been created."
        })
      }
    } catch (error) {
      console.error('Failed to generate email:', error)
      toast.error("Error", {
        description: "Failed to generate email. Please try again."
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <button
      className={cn(
        "text-sm font-medium underline underline-offset-4 text-primary p-0 bg-transparent border-none cursor-pointer",
        isGenerating && "opacity-70 cursor-not-allowed",
        className
      )}
      onClick={handleGenerateEmail}
      disabled={isGenerating}
    >
      {isGenerating ? 'Generating...' : 'Generate email'}
    </button>
  )
}