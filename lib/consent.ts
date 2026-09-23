import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ConsentDecision = 'granted' | 'denied'

interface ConsentState {
  /** null until the visitor has actually chosen. */
  decision: ConsentDecision | null
  /** False until localStorage has been read, to avoid a banner flash. */
  hydrated: boolean
  /** Forced open again from the "Gérer mes cookies" footer link. */
  reopened: boolean
  accept: () => void
  refuse: () => void
  reopen: () => void
  close: () => void
  setHydrated: () => void
}

/**
 * Whether non-essential measurement may run.
 *
 * Until GA4 arrived, this site had nothing to consent to: every cookie
 * was strictly necessary and Vercel Web Analytics writes none. GA4 is a
 * non-exempt tracker under art. 82 of the loi Informatique et Libertés,
 * so it needs prior opt-in, and a dismissible "Compris" notice is not
 * opt-in. Refusing has to be exactly as easy as accepting, which is why
 * the banner has two buttons of equal weight and no pre-selection.
 *
 * `decision` starts null and denial is the default in every consumer, so
 * a visitor who never chooses is treated as having refused.
 */
export const useConsent = create<ConsentState>()(
  persist(
    (set) => ({
      decision: null,
      hydrated: false,
      reopened: false,
      accept: () => set({ decision: 'granted', reopened: false }),
      refuse: () => set({ decision: 'denied', reopened: false }),
      reopen: () => set({ reopened: true }),
      close: () => set({ reopened: false }),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'souqify-consent',
      // `reopened` and `hydrated` are per-visit UI state, not a decision.
      partialize: (state) => ({ decision: state.decision }) as ConsentState,
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    }
  )
)
