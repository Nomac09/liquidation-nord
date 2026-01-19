'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PhotosUpload() {
  const [uploadResults, setUploadResults] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadComplete, setUploadComplete] = useState(false)
  const router = useRouter()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsProcessing(true)
    setUploadComplete(false)
    
    const formData = new FormData()
    Array.from(files).forEach(file => {
      formData.append('images', file)
    })

    try {
      const response = await fetch('/api/upload-images-bulk', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()
      setUploadResults(result)
      setUploadComplete(true)
      
      // Auto-redirect to home after 3 seconds if successful
      if (result.success && result.matched > 0) {
        setTimeout(() => {
          router.push('/')
        }, 3000)
      }
    } catch (error) {
      console.error('Error uploading images:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  if (uploadComplete && uploadResults?.success && uploadResults?.matched > 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 max-w-md mx-auto">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-green-800 mb-2">
            Succès!
          </h1>
          <p className="text-green-700 mb-4">
            {uploadResults.matched} images ont été ajoutées à vos produits!
          </p>
          <p className="text-green-600 text-sm">
            Redirection vers la page d'accueil...
          </p>
          <div className="mt-4 animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-anthracite mb-8">
        📸 Upload Photos
      </h1>

      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h2 className="text-lg font-semibold mb-4">Bulk Image Upload</h2>
        <p className="text-warm-gray mb-4">
          Upload images with EAN in filename (e.g., 8718475600800_m.jpg)
        </p>
        
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileUpload}
          disabled={isProcessing}
          className="block w-full text-sm text-warm-gray 
            file:mr-4 file:py-2 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-semibold
            file:bg-oak file:text-white
            hover:file:bg-anthracite
            cursor-pointer disabled:opacity-50"
        />
      </div>

      {isProcessing && (
        <div className="bg-blue-50 p-6 rounded-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-oak mx-auto mb-4"></div>
          <p className="text-oak font-medium">Processing uploaded images and matching to products...</p>
          <p className="text-sm text-warm-gray mt-2">This may take a moment for larger files</p>
        </div>
      )}

      {uploadResults && !uploadComplete && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Résultats</h3>
          <div className="space-y-2">
            <p className="text-green-600">✅ Images correspondantes: {uploadResults.matched}</p>
            <p className="text-red-600">❌ Erreurs: {uploadResults.errors?.length || 0}</p>
          </div>
          
          {uploadResults.errors?.length > 0 && (
            <div className="mt-4 bg-red-50 p-4 rounded">
              <h4 className="font-medium text-red-800 mb-2">Erreurs:</h4>
              <ul className="text-red-600 text-sm space-y-1">
                {uploadResults.errors.map((error: string, i: number) => (
                  <li key={i}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="mt-6">
            <a 
              href="/" 
              className="inline-block bg-oak text-white px-6 py-2 rounded-lg hover:bg-anthracite transition-colors"
            >
              Voir les produits →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
