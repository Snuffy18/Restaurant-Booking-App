import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const isAdmin = user.app_metadata?.role === 'admin'
  if (isAdmin) redirect('/admin')

  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_id', user.id)
    .limit(1)
    .single()

  if (restaurants?.id) redirect(`/builder/${restaurants.id}`)

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">No restaurant found</h1>
        <p className="text-gray-500">Contact your administrator to get access.</p>
      </div>
    </div>
  )
}
