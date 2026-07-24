'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { AlertCircle, ArrowRight, ShoppingBag, Trash2 } from 'lucide-react'
import { useCart } from '@/lib/cart'
import { formatPrice } from '@/components/Sticker'

const SHIPPING = {
  pickup: { label: 'Retrait à Bondues', detail: 'Gratuit · Lun–Sam 9h–18h', cost: 0 },
  relay: { label: 'Point relais', detail: 'Mondial Relay · max 130 kg', cost: 29.99 },
  home: { label: 'À domicile', detail: 'Cocolis · 3 à 5 jours', cost: 79.99 },
} as const

type ShippingMethod = keyof typeof SHIPPING

interface CustomerForm {
  name: string
  phone: string
  line1: string
  line2: string
  postalCode: string
  city: string
}

const EMPTY_CUSTOMER: CustomerForm = { name: '', phone: '', line1: '', line2: '', postalCode: '', city: '' }

export default function CartPage() {
  const { items, removeItem, total } = useCart()
  const { status } = useSession()
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('pickup')
  const [customer, setCustomer] = useState<CustomerForm>(EMPTY_CUSTOMER)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [unavailable, setUnavailable] = useState<string[]>([])
  const router = useRouter()

  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/account')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return
        setCustomer({
          name: data.name || '',
          phone: data.phone || '',
          line1: data.address?.line1 || '',
          line2: data.address?.line2 || '',
          postalCode: data.address?.postalCode || '',
          city: data.address?.city || '',
        })
      })
      .catch(() => {})
  }, [status])

  const setField = (key: keyof CustomerForm, value: string) =>
    setCustomer((c) => ({ ...c, [key]: value }))

  const customerComplete =
    customer.name.trim() && customer.phone.trim() && customer.line1.trim() && customer.postalCode.trim() && customer.city.trim()

  const handleCheckout = async () => {
    setIsLoading(true)
    setError('')
    setUnavailable([])
    try {
      const response = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({ productId: item.productId })),
          shippingMethod,
          customer: {
            name: customer.name,
            phone: customer.phone,
            address: {
              line1: customer.line1,
              line2: customer.line2,
              postalCode: customer.postalCode,
              city: customer.city,
            },
          },
        }),
      })

      if (response.status === 409) {
        const data = await response.json()
        const unavailableIds: string[] = data.items?.map((i: { productId: string }) => i.productId) || []
        const names: string[] = data.items?.map((i: { name: string }) => i.name) || []
        unavailableIds.forEach((id) => removeItem(id))
        setUnavailable(names)
        setIsLoading(false)
        return
      }

      if (response.status === 400) {
        setError('Merci de renseigner vos coordonnées complètes avant de payer.')
        setIsLoading(false)
        return
      }

      const { url } = await response.json()
      if (!url) throw new Error('no-url')
      router.push(url)
    } catch {
      setError('Le paiement n’a pas pu démarrer. Réessayez, ou contactez-nous.')
      setIsLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <ShoppingBag aria-hidden className="mx-auto h-10 w-10 text-gris" />
        <h1 className="mt-4 font-display text-3xl font-bold text-encre">
          Votre panier est vide
        </h1>
        <p className="mx-auto mt-2 max-w-md text-gris">
          Les pièces partent vite — chaque article est en un seul exemplaire.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-bleu px-8 py-3 text-sm font-semibold text-blanc transition-colors hover:bg-bleu-deep"
        >
          Parcourir l’arrivage
          <ArrowRight aria-hidden className="h-4 w-4" />
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="font-display text-3xl font-bold tracking-tight text-encre">
        Votre panier
      </h1>
      <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-gris">
        {items.length} article{items.length > 1 ? 's' : ''}
      </p>

      {status !== 'authenticated' && (
        <p className="mt-3 text-sm text-gris">
          <Link href={`/login?callbackUrl=${encodeURIComponent('/cart')}`} className="font-semibold text-bleu hover:underline">
            Connectez-vous
          </Link>{' '}
          pour préremplir vos coordonnées la prochaine fois.
        </p>
      )}

      {unavailable.length > 0 && (
        <div role="alert" className="mt-6 flex items-start gap-2 rounded-lg bg-orange-pale px-4 py-3 text-sm text-orange-deep">
          <AlertCircle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {unavailable.length === 1
              ? `« ${unavailable[0]} » vient d’être vendue — elle a été retirée de votre panier.`
              : `Ces pièces viennent d’être vendues et ont été retirées de votre panier : ${unavailable.join(', ')}.`}
          </span>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.productId}
                className="flex gap-4 rounded-xl border border-ligne bg-blanc p-4 shadow-carte"
              >
                <img
                  src={item.photo || '/placeholder.png'}
                  alt=""
                  className="h-24 w-24 shrink-0 rounded-lg border border-ligne object-cover"
                />
                <div className="min-w-0 flex-1">
                  <h2 className="line-clamp-2 font-medium leading-snug text-encre">
                    {item.name}
                  </h2>
                  <p className="mt-1 font-mono font-semibold text-encre">
                    {formatPrice(item.price)} €
                  </p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-gris">
                    Pièce unique
                  </p>
                </div>
                <button
                  onClick={() => removeItem(item.productId)}
                  aria-label={`Retirer ${item.name}`}
                  className="self-start p-1.5 text-gris transition-colors hover:text-orange-deep"
                >
                  <Trash2 aria-hidden className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>

          <div className="rounded-xl border border-ligne bg-blanc p-6 shadow-carte">
            <h2 className="tag-label">Vos coordonnées</h2>
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="cust-name" className="tag-label">Nom complet</label>
                  <input
                    id="cust-name"
                    type="text"
                    required
                    value={customer.name}
                    onChange={(e) => setField('name', e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-ligne px-3.5 py-2.5 text-sm text-encre focus:border-bleu"
                  />
                </div>
                <div>
                  <label htmlFor="cust-phone" className="tag-label">Téléphone</label>
                  <input
                    id="cust-phone"
                    type="tel"
                    required
                    placeholder="06 12 34 56 78"
                    value={customer.phone}
                    onChange={(e) => setField('phone', e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-ligne px-3.5 py-2.5 text-sm text-encre focus:border-bleu"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="cust-line1" className="tag-label">Adresse</label>
                <input
                  id="cust-line1"
                  type="text"
                  required
                  value={customer.line1}
                  onChange={(e) => setField('line1', e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-ligne px-3.5 py-2.5 text-sm text-encre focus:border-bleu"
                />
              </div>
              <div>
                <label htmlFor="cust-line2" className="tag-label">Complément (optionnel)</label>
                <input
                  id="cust-line2"
                  type="text"
                  value={customer.line2}
                  onChange={(e) => setField('line2', e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-ligne px-3.5 py-2.5 text-sm text-encre focus:border-bleu"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="cust-postal" className="tag-label">Code postal</label>
                  <input
                    id="cust-postal"
                    type="text"
                    required
                    value={customer.postalCode}
                    onChange={(e) => setField('postalCode', e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-ligne px-3.5 py-2.5 text-sm text-encre focus:border-bleu"
                  />
                </div>
                <div>
                  <label htmlFor="cust-city" className="tag-label">Ville</label>
                  <input
                    id="cust-city"
                    type="text"
                    required
                    value={customer.city}
                    onChange={(e) => setField('city', e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-ligne px-3.5 py-2.5 text-sm text-encre focus:border-bleu"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-ligne bg-blanc p-6 shadow-carte">
            <h2 className="font-display text-lg font-bold text-encre">Récapitulatif</h2>

            <fieldset className="mt-4">
              <legend className="tag-label">Comment récupérer vos pièces ?</legend>
              <div className="mt-3 space-y-2">
                {(Object.keys(SHIPPING) as ShippingMethod[]).map((key) => {
                  const opt = SHIPPING[key]
                  const active = shippingMethod === key
                  return (
                    <label
                      key={key}
                      className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 transition-colors ${
                        active ? 'border-bleu bg-bleu-pale' : 'border-ligne hover:border-gris'
                      }`}
                    >
                      <input
                        type="radio"
                        name="shipping"
                        value={key}
                        checked={active}
                        onChange={() => setShippingMethod(key)}
                        className="sr-only"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-encre">{opt.label}</span>
                        <span className="block text-xs text-gris">{opt.detail}</span>
                      </span>
                      <span className={`font-mono text-sm font-semibold ${active ? 'text-bleu' : 'text-encre'}`}>
                        {opt.cost === 0 ? '0 €' : `${formatPrice(opt.cost)} €`}
                      </span>
                    </label>
                  )
                })}
              </div>
            </fieldset>

            <dl className="mt-5 space-y-2 border-t border-ligne pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-gris">Sous-total</dt>
                <dd className="font-mono">{formatPrice(total())} €</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gris">Livraison</dt>
                <dd className="font-mono">{formatPrice(SHIPPING[shippingMethod].cost)} €</dd>
              </div>
              <div className="flex justify-between border-t border-ligne pt-2 text-base font-semibold">
                <dt>Total</dt>
                <dd className="font-mono">
                  {formatPrice(total() + SHIPPING[shippingMethod].cost)} €
                </dd>
              </div>
            </dl>

            {error && (
              <p role="alert" className="mt-3 rounded-lg bg-orange-pale px-3 py-2 text-sm text-orange-deep">
                {error}
              </p>
            )}

            <button
              onClick={handleCheckout}
              disabled={isLoading || !customerComplete}
              className="mt-5 w-full rounded-full bg-bleu py-3.5 text-sm font-semibold text-blanc transition-colors hover:bg-bleu-deep disabled:opacity-60"
            >
              {isLoading ? 'Redirection vers le paiement…' : 'Payer maintenant'}
            </button>
            {!customerComplete && (
              <p className="mt-2 text-center text-xs text-gris">
                Complétez vos coordonnées ci-dessus pour continuer.
              </p>
            )}
          </div>

          <p className="text-center font-mono text-[10px] uppercase tracking-widest text-gris">
            Paiement sécurisé Stripe · TVA non applicable, art. 293 B du CGI
          </p>
        </div>
      </div>
    </div>
  )
}
