'use client'

import { useState, useTransition } from 'react'
import type { User } from '@supabase/supabase-js'
import { createRestaurant } from './actions'

interface Props {
  users: User[]
}

export default function CreateRestaurantForm({ users }: Props) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await createRestaurant(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          New restaurant
        </button>
      ) : (
        <form
          action={handleSubmit}
          className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex flex-col gap-4"
        >
          <p className="text-sm font-semibold text-gray-800">Create new restaurant</p>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500">
              Restaurant name <span className="text-red-400">*</span>
            </label>
            <input
              name="name"
              type="text"
              required
              autoFocus
              placeholder="e.g. The Golden Fork"
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-400"
            />
          </div>

          {users.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500">Assign owner</label>
              <select
                name="owner_id"
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-700"
              >
                <option value="">— no owner —</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.email ?? u.id}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={pending}
              className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {pending ? 'Creating…' : 'Create & open builder'}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setError(null) }}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
