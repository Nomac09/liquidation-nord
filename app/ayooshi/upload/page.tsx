'use client'

import { useState } from 'react'

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setUploading(true)
    setMessage('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/upload-xlsx', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      
      if (response.ok) {
        setMessage(`✅ Uploaded ${data.imported} products, updated ${data.updated}`)
        if (data.errors.length > 0) {
          setMessage(prev => prev + `, ${data.errors.length} errors`)
        }
      } else {
        setMessage(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      setMessage('❌ Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-anthracite mb-8">
        📊 Upload Products
      </h1>

      <div className="bg-white p-6 rounded-lg shadow-sm max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Excel File (.xlsx)
            </label>
            <input
              type="file"
              accept=".xlsx"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-oak"
              required
            />
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-oak text-white py-3 rounded-lg font-semibold hover:bg-anthracite transition-colors disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Upload Products'}
          </button>

          {message && (
            <div className={`p-4 rounded-lg ${
              message.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
