'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function createRestaurant(formData: FormData) {
  const name = (formData.get('name') as string)?.trim()
  const ownerId = (formData.get('owner_id') as string)?.trim()

  if (!name) return { error: 'Restaurant name is required' }

  const supabase = await createClient()
  const { data: newR, error } = await supabase
    .from('restaurants')
    .insert({ name, owner_id: ownerId || null })
    .select('id')
    .single()

  if (error || !newR?.id) return { error: error?.message ?? 'Failed to create restaurant' }

  redirect(`/builder/${newR.id}`)
}
