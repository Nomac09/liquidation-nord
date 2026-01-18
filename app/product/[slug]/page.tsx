

import ImageGallery from '@/components/ImageGallery'
import DeliveryToggle from '@/components/DeliveryToggle'
import AddToCart from '@/components/AddToCart'
import connectDB from '@/lib/mongodb'
import Product from '@/lib/schemas/Product'
import { notFound } from 'next/navigation'

async function getProduct(slug: string) {
  await connectDB()
  const product = await Product.findOne({ slug, status: 'sellable' })
  return JSON.parse(JSON.stringify(product))
}

export async function generateStaticParams() {
  await connectDB()
  const products = await Product.find({ status: 'sellable' }).limit(50)
  return products.map((product) => ({
    slug: product.slug,
  }))
}

export default async function ProductPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-beige">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div>
            <ImageGallery photos={product.photos} name={product.name} />
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-anthracite mb-2">
                {product.name}
              </h1>
              <p className="text-sm text-warm-gray mb-4">
                Réf: {product.ean} • Catégorie: {product.category}
              </p>
            </div>

            {/* Pricing */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-3xl font-bold text-oak">
                  {product.salePrice}€
                </span>
                <span className="text-lg text-warm-gray line-through">
                  {product.rrp}€
                </span>
                <span className="bg-oak text-white px-3 py-1 rounded-full text-sm font-semibold">
                  -{Math.round((1 - product.salePrice / product.rrp) * 100)}%
                </span>
              </div>
              
              <p className="text-sm text-warm-gray mb-4">
                Condition: {product.condition}
              </p>

              {product.dimensions && (
                <p className="text-sm text-warm-gray mb-4">
                  Dimensions: {product.dimensions}
                </p>
              )}

              {product.weight && (
                <p className="text-sm text-warm-gray mb-4">
                  Poids: {product.weight}kg
                </p>
              )}

              <AddToCart product={product} />
            </div>

            {/* Delivery Options */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Options de livraison</h3>
              <DeliveryToggle />
            </div>

            {/* Cross-platform link */}
            <div className="bg-oak text-white p-4 rounded-lg">
              <p className="font-semibold mb-2">📱 Voir aussi sur Leboncoin</p>
              <a 
                href={`https://www.leboncoin.fr/recherche?text=${encodeURIComponent(product.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:no-underline"
              >
                Rechercher sur Leboncoin →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}