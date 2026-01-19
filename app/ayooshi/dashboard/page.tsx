'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0
  })

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error('Failed to fetch stats:', err))
  }, [])

  return (
    <div className="min-h-screen bg-beige p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-anthracite mb-8">
          Ayooshi Dashboard
        </h1>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link href="/ayooshi/upload" className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="text-center">
              <div className="text-2xl mb-2">📊</div>
              <h3 className="font-semibold">Upload Excel</h3>
              <p className="text-sm text-gray-600">Import new products</p>
            </div>
          </Link>

          <Link href="/ayooshi/upload-images" className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="text-center">
              <div className="text-2xl mb-2">📸</div>
              <h3 className="font-semibold">Bulk Images</h3>
              <p className="text-sm text-gray-600">Upload product photos</p>
            </div>
          </Link>

          <Link href="/ayooshi/add-product" className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="text-center">
              <div className="text-2xl mb-2">➕</div>
              <h3 className="font-semibold">Add Product</h3>
              <p className="text-sm text-gray-600">Single product</p>
            </div>
          </Link>

          <Link href="/ayooshi/orders" className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="text-center">
              <div className="text-2xl mb-2">📦</div>
              <h3 className="font-semibold">Orders</h3>
              <p className="text-sm text-gray-600">Manage orders</p>
            </div>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Total Products</h3>
            <p className="text-3xl font-bold text-oak">{stats.totalProducts}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Total Orders</h3>
            <p className="text-3xl font-bold text-oak">{stats.totalOrders}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Total Revenue</h3>
            <p className="text-3xl font-bold text-oak">€{stats.totalRevenue}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
