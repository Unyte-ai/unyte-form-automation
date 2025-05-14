'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Deletes a form submission from the database
 */
export async function deleteFormSubmission(id: string, organizationId: string) {
  const supabase = await createClient()
  
  try {
    // Delete the form submission
    const { error } = await supabase
      .from('form_submissions')
      .delete()
      .eq('id', id)
    
    if (error) {
      throw new Error(`Failed to delete form: ${error.message}`)
    }
    
    // Revalidate the path to update the UI
    revalidatePath(`/home/${organizationId}`)
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting form submission:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    }
  }
}