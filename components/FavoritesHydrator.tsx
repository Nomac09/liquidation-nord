'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useFavorites } from '@/lib/favorites'

// Mounted once near the app root. Loads the signed-in customer's favorite
// product ids so any FavoriteButton on the page can render its state
// immediately, without each card fetching on its own.
export default function FavoritesHydrator() {
  const { status } = useSession()
  const hydrate = useFavorites((s) => s.hydrate)

  useEffect(() => {
    if (status !== 'authenticated') {
      hydrate([])
      return
    }
    fetch('/api/favorites')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.productIds) hydrate(data.productIds)
      })
      .catch(() => {})
  }, [status, hydrate])

  return null
}
