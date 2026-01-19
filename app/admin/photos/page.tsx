'use client'

import { useState } from 'react'

export default function PhotosUpload() {
  const [uploadResults, setUploadResults] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsProcessing(true)
    
    const formData = new FormData()
    Array.from(files).forEach(file => {
      formData.append('images', file)
    })

    try {
      // Use your existing bulk upload API
      const response = await fetch('/api/upload-images-bulk', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()
      setUploadResults(result)
    } catch (error) {
      console.error('Error uploading images:', error)
    } finally {
      setIsProcessing(false)
    }
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
          className="block w-full text-sm text-warm-gray 
            file:mr-4 file:py-2 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-semibold
            file:bg-oak file:text-white
            hover:file:bg-anthracite
            cursor-pointer"
        />
      </div>

      {isProcessing && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <p>Processing uploaded images and matching to products...</p>
        </div>
      )}

      {uploadResults && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Results</h3>
          <p>✅ Matched: {uploadResults.matched}</p>
          <p>❌ Errors: {uploadResults.errors?.length || 0}</p>
          {uploadResults.errors?.length > 0 && (
            <div className="mt-4">
              <h4>Errors:</h4>
              <ul className="text-red-600">
                {uploadResults.errors.map((error: string, i: number) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
