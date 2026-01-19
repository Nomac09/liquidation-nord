'use client'

import Link from 'next/link'

export default function AyooshiDashboard() {
  return (
    <div className="min-h-screen bg-beige">
      <nav className="bg-anthracite text-white p-4">
        <div className="container mx-auto flex gap-6">
          <span className="font-bold">🎯 Ayooshi Admin</span>
          <Link href="/ayooshi/upload" className="hover:text-oak">📊 Upload</Link>
          <Link href="/ayooshi/add" className="hover:text-oak">➕ Add</Link>
          <Link href="/ayooshi/orders" className="hover:text-oak">📦 Orders</Link>
          <Link href="/" className="ml-auto hover:text-oak">🏠 Main Site</Link>
        </div>
      </nav>
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-anthracite mb-8">
          Bienvenue Ayooshi 👋
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link href="/ayooshi/upload" className="block w-full bg-oak text-white py-3 px-4 rounded-lg text-center hover:bg-anthracite transition-colors">
                📊 Upload Excel
              </Link>
              <Link href="/ayooshi/add" className="block w-full bg-warm-gray text-white py-3 px-4 rounded-lg text-center hover:bg-anthracite transition-colors">
                ➕ Add Product
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
