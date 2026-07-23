import { redirect } from 'next/navigation'

// The cart page owns the whole checkout flow (shipping choice + Stripe
// session); this route only exists for old links.
export default function CheckoutPage() {
  redirect('/cart')
}
