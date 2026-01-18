

import ProductCard from '@/components/ProductCard'
import connectDB from '@/lib/mongodb'
import Product from '@/lib/schemas/Product'
import { Search } from 'lucide-react'
import Link from 'next/link'

// Add product interface
interface Product {
  _id: string
  name: string
  ean: string
  category: string
  rrp: number
  salePrice: number
  photos: string[]
  status: string
  condition: string
  dimensions?: string
  weight?: number
  slug: string
  createdAt: Date
  updatedAt: Date
}

async function getProducts(category?: string, search?: string) {
  try {
    await connectDB()
    
    const query: any = { status: 'sellable' }
    if (category) query.category = category
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { ean: { $regex: search, $options: 'i' } }
      ]
    }
    
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
    
    return JSON.parse(JSON.stringify(products)) as Product[]
  } catch (error) {
    console.error('Error fetching products:', error)
    return [] as Product[]
  }
}

export default async function HomePage({
  searchParams
}: {
  searchParams: Promise<{ category?: string; search?: string }>
}) {
  // Await the searchParams promise
  const params = await searchParams
  const products = await getProducts(params.category, params.search)

  return (
    <div className="min-h-screen bg-beige">
      {/* Hero Section */}
      <div className="bg-anthracite text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Liquidation Nord
          </h1>
          <p className="text-xl mb-8">
            Meubles & Déco à -60% • Stock limité • Nouveautés mensuelles
          </p>
          
          {/* Search Bar */}
          <form className="max-w-md">
            <div className="relative">
              <input
                type="text"
                name="search"
                placeholder="Rechercher par nom ou EAN..."
                className="w-full px-4 py-3 pl-12 rounded-lg text-black"
                defaultValue={params.search}
              />
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-warm-gray" />
            </div>
          </form>
        </div>
      </div>

      {/* Banner */}
      <div className="bg-oak text-white py-3">
        <div className="container mx-auto px-4 text-center">
          <p className="font-semibold">
            📦 Nouveaux arrivages mensuels • Stock limité • Enlèvement gratuit à Bondues
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-4 mb-8">
          <Link
            href="/?category=Mobilier"
            className={`px-6 py-2 rounded-lg border-2 ${
              params.category === 'Mobilier' 
                ? 'bg-anthracite text-white border-anthracite' 
                : 'bg-white text-anthracite border-anthracite hover:bg-anthracite hover:text-white'
            }`}
          >
            Mobilier
          </Link>
          <Link
            href="/?category=Bricolage"
            className={`px-6 py-2 rounded-lg border-2 ${
              params.category === 'Bricolage' 
                ? 'bg-anthracite text-white border-anthracite' 
                : 'bg-white text-anthracite border-anthracite hover:bg-anthracite hover:text-white'
            }`}
          >
            Bricolage
          </Link>
          <Link
            href="/?category=Textile"
            className={`px-6 py-2 rounded-lg border-2 ${
              params.category === 'Textile' 
                ? 'bg-anthracite text-white border-anthracite' 
                : 'bg-white text-anthracite border-anthracite hover:bg-anthracite hover:text-white'
            }`}
          >
            Textile
          </Link>
          <Link
            href="/"
            className="px-6 py-2 rounded-lg bg-warm-gray text-white border-2 border-warm-gray"
          >
            Tout voir
          </Link>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product: Product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-warm-gray">
              Aucun produit trouvé pour cette catégorie.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}