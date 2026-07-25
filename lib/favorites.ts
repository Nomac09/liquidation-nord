import { create } from 'zustand'

interface FavoritesState {
  ids: Set<string>
  hydrate: (ids: string[]) => void
  isFavorite: (productId: string) => boolean
  toggle: (productId: string) => Promise<void>
}

// Not persisted — the account, not the browser, is the source of truth.
// FavoritesHydrator fills this from the server on sign-in / app load.
export const useFavorites = create<FavoritesState>((set, get) => ({
  ids: new Set(),
  hydrate: (ids) => set({ ids: new Set(ids) }),
  isFavorite: (productId) => get().ids.has(productId),
  toggle: async (productId) => {
    const had = get().ids.has(productId)
    set((s) => {
      const next = new Set(s.ids)
      had ? next.delete(productId) : next.add(productId)
      return { ids: next }
    })
    try {
      const res = await fetch(`/api/favorites/${productId}`, { method: had ? 'DELETE' : 'POST' })
      if (!res.ok) throw new Error('request failed')
    } catch {
      // Revert the optimistic update — the server never confirmed it.
      set((s) => {
        const next = new Set(s.ids)
        had ? next.add(productId) : next.delete(productId)
        return { ids: next }
      })
    }
  },
}))
