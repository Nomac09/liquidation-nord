// app/admin/upload/page.tsx
'use client'

import { useState } from 'react'

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload-xlsx', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      setResult(data)
    } catch (error) {
      setResult({ error: 'Erreur lors de l\'import' })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-anthracite mb-8">
        Importer des produits
      </h1>

      <div className="bg-white p-6 rounded-lg shadow-sm max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Fichier Excel (.xlsx)
            </label>
            <input
              type="file"
              accept=".xlsx"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-oak"
              required
            />
          </div>

          <div className="bg-beige p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Format attendu:</h3>
            <ul className="text-sm text-warm-gray space-y-1">
              <li>• EAN (colonne A)</li>
              <li>• Name/Nom (colonne B)</li>
              <li>• RRP/Prix (colonne C)</li>
              <li>• Category/Catégorie (colonne D)</li>
              <li>• Quantity/Quantité (colonne E, optionnel)</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-oak text-white py-3 rounded-lg font-semibold hover:bg-anthracite transition-colors disabled:opacity-50"
          >
            {uploading ? 'Import en cours...' : 'Importer les produits'}
          </button>
        </form>

        {result && (
          <div className={`mt-6 p-4 rounded-lg ${
            result.error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {result.error ? (
              <p>{result.error}</p>
            ) : (
              <div>
                <p className="font-semibold">Import réussi !</p>
                <p>• {result.imported} produits importés</p>
                <p>• {result.updated} produits mis à jour</p>
                {result.errors.length > 0 && (
                  <p>• {result.errors.length} erreurs</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}