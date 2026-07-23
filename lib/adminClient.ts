'use client'

// Client-side helper: after login the admin password lives in sessionStorage
// and is attached to back-office API calls.
export function adminHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const password = sessionStorage.getItem('admin-password')
  return password ? { 'x-admin-password': password } : {}
}
