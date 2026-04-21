'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function createRestaurant(formData: FormData) {
  const name = (formData.get('name') as string)?.trim()
  const ownerId = (formData.get('owner_id') as string)?.trim()

  if (!name) return { error: 'Restaurant name is required' }

  const supabase = await createClient()

  // Fall back to the currently logged-in admin if no owner was selected
  let resolvedOwnerId = ownerId
  if (!resolvedOwnerId) {
    const { data: { user } } = await supabase.auth.getUser()
    resolvedOwnerId = user?.id ?? ''
  }
  if (!resolvedOwnerId) return { error: 'Could not determine owner — please select one from the list' }

  const { data: newR, error } = await supabase
    .from('restaurants')
    .insert({ name, owner_id: resolvedOwnerId })
    .select('id')
    .single()

  if (error || !newR?.id) return { error: error?.message ?? 'Failed to create restaurant' }

  redirect(`/builder/${newR.id}`)
}
