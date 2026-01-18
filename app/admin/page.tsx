// app/admin/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Stats {
  totalProducts: number
  totalOrders: number
  totalRevenue: number
  soldCount: number
  topCategories: any[]
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-oak"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-anthracite mb-8">
        Tableau de bord
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-warm-gray mb-2">Produits en stock</h3>
          <p className="text-3xl font-bold text-anthracite">{stats?.totalProducts || 0}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-warm-gray mb-2">Commandes</h3>
          <p className="text-3xl font-bold text-anthracite">{stats?.totalOrders || 0}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-warm-gray mb-2">Chiffre d'affaires</h3>
          <p className="text-3xl font-bold text-oak">{stats?.totalRevenue.toFixed(0) || 0}€</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-warm-gray mb-2">Produits vendus</h3>
          <p className="text-3xl font-bold text-green-600">{stats?.soldCount || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Actions rapides</h3>
          <div className="space-y-3">
            <Link
              href="/admin/upload"
              className="block w-full bg-oak text-white py-3 px-4 rounded-lg text-center hover:bg-anthracite transition-colors"
            >
              📊 Importer des produits (XLSX)
            </Link>
            <Link
              href="/admin/photos"
              className="block w-full bg-warm-gray text-white py-3 px-4 rounded-lg text-center hover:bg-anthracite transition-colors"
            >
              📸 Gérer les photos
            </Link>
            <Link
              href="/admin/orders"
              className="block w-full bg-anthracite text-white py-3 px-4 rounded-lg text-center hover:bg-oak transition-colors"
            >
              📦 Voir les commandes
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Top catégories</h3>
          <div className="space-y-2">
            {stats?.topCategories.map((cat: any) => (
              <div key={cat._id} className="flex justify-between">
                <span>{cat._id}</span>
                <span className="font-semibold">{cat.count} produits</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}