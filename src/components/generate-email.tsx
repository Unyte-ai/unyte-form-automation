'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { generateAliasEmail } from '@/app/actions/addy'
import { useState } from 'react'
import { toast } from 'sonner'

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
      const email = await generateAliasEmail()
      
      if (onEmailGenerated && email) {
        onEmailGenerated(email)
        toast.success("Email generated", {
          description: "Your new email alias has been created successfully."
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