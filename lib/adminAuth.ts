import { NextRequest, NextResponse } from 'next/server'

// Server-side admin check for mutation/back-office API routes.
// The password travels in the x-admin-password header, never in the bundle.
export function requireAdmin(request: NextRequest): NextResponse | null {
  const password = request.headers.get('x-admin-password')
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}
