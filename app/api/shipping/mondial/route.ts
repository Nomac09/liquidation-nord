import { NextRequest, NextResponse } from 'next/server'

// Placeholder for Mondial Relay API integration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Placeholder response - implement when API keys are available
    return NextResponse.json([
      {
        id: 'placeholder-1',
        name: 'Point Relais Placeholder',
        address: '123 Rue de la Paix, 75000 Paris',
        lat: 48.8566,
        lng: 2.3522
      }
    ])
  } catch (error) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }
}
