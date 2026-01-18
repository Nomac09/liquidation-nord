import { NextRequest, NextResponse } from 'next/server'

// Placeholder - will implement when Stripe keys are available
export async function POST(request: NextRequest) {
  console.log('Stripe webhook received - API keys not configured yet')
  
  return NextResponse.json({ received: true })
}
