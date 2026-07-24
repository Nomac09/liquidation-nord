'use client'

import { useEffect, useState } from 'react'

export type ViewMode = 'tickets' | 'registre'
const KEY = 'souqify-view-mode'

// Persisted client-side per the browsability note: dense "Registre" list
// for fast scanning vs. the wide "Tickets" rows. Defaults to 'tickets' on
// both server and first client render so hydration always matches; the
// stored preference (if any) applies right after mount.
export function useViewMode() {
  const [mode, setModeState] = useState<ViewMode>('tickets')

  useEffect(() => {
    const stored = window.localStorage.getItem(KEY)
    if (stored === 'tickets' || stored === 'registre') setModeState(stored)
  }, [])

  const setMode = (next: ViewMode) => {
    setModeState(next)
    window.localStorage.setItem(KEY, next)
  }

  return { mode, setMode }
}
