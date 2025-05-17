'use client'

import { DeleteForm } from '@/components/delete-form'
import { useRouter } from 'next/navigation'

interface FormItemProps {
  id: string
  title: string
}

export function FormItem({ id, title }: FormItemProps) {
  const router = useRouter()

  const handleClick = () => {
    router.push(`/forms/${id}`)
  }

  return (
    <div className="group relative rounded-md border border-border bg-background hover:bg-accent/25 hover:border-primary hover:shadow-sm transition-all">
      {/* Position the delete button inside but absolutely positioned */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 transform scale-90 transition-all duration-200 
                    group-hover:opacity-100 group-hover:scale-100 z-10">
        <DeleteForm id={id} title={title} />
      </div>
      
      {/* The actual button content */}
      <button 
        className="p-4 w-full text-left cursor-pointer"
        onClick={handleClick}
      >
        <p className="font-medium truncate pr-8">
          {title}
        </p>
      </button>
    </div>
  )
}