import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import CreateRestaurantForm from './CreateRestaurantForm'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.app_metadata?.role !== 'admin') redirect('/')

  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('id, name, owner_id, created_at')
    .order('created_at', { ascending: false })

  // Fetch users so we can show owner emails and let admin assign owners
  const { data: { users } } = await supabase.auth.admin.listUsers()

  const userMap: Record<string, string> = {}
  for (const u of users ?? []) userMap[u.id] = u.email ?? u.id

  async function createRestaurant(formData: FormData) {
    'use server'
    const name = (formData.get('name') as string)?.trim()
    const ownerId = (formData.get('owner_id') as string)?.trim()
    if (!name) return

    const supabase = await createClient()
    const { data: newR } = await supabase
      .from('restaurants')
      .insert({ name, owner_id: ownerId || null })
      .select('id')
      .single()

    if (newR?.id) redirect(`/builder/${newR.id}`)
    else redirect('/admin')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
          </div>
          <span className="font-semibold text-gray-900">Floor Plan Builder</span>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">Admin</span>
        </div>
        <form action="/api/auth/signout" method="post">
          <button className="text-sm text-gray-500 hover:text-gray-700">Sign out</button>
        </form>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-gray-900">All Restaurants</h1>
          <span className="text-sm text-gray-500">{restaurants?.length ?? 0} total</span>
        </div>

        {/* Create form */}
        <CreateRestaurantForm users={users ?? []} action={createRestaurant} />

        {/* Restaurant list */}
        {restaurants && restaurants.length > 0 ? (
          <div className="grid gap-3 mt-6">
            {restaurants.map((r) => (
              <Link
                key={r.id}
                href={`/builder/${r.id}`}
                className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center justify-between hover:border-gray-300 hover:shadow-sm transition-all group"
              >
                <div>
                  <p className="font-medium text-gray-900 group-hover:text-gray-700">{r.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {userMap[r.owner_id] && (
                      <span className="mr-2">{userMap[r.owner_id]}</span>
                    )}
                    {new Date(r.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm">No restaurants yet — create one above.</p>
          </div>
        )}
      </main>
    </div>
  )
}
