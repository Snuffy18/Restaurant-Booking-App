import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BuilderClient from '@/components/builder/BuilderClient'
import type { Floor, Restaurant } from '@/types/floorplan'

interface Props {
  params: Promise<{ restaurantId: string }>
}

export default async function BuilderPage({ params }: Props) {
  const { restaurantId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const isAdmin = user.app_metadata?.role === 'admin'

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name, owner_id, created_at')
    .eq('id', restaurantId)
    .single()

  if (!restaurant) redirect(isAdmin ? '/admin' : '/')

  if (!isAdmin && restaurant.owner_id !== user.id) redirect('/')

  const { data: floors } = await supabase
    .from('floors')
    .select('id, restaurant_id, name, order, elements')
    .eq('restaurant_id', restaurantId)
    .order('order', { ascending: true })

  return (
    <BuilderClient
      key={restaurantId}
      restaurant={restaurant as Restaurant}
      initialFloors={(floors ?? []) as Floor[]}
      isAdmin={isAdmin}
    />
  )
}
