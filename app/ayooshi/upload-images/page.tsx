'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

export default function BulkImageUpload() {
  const [uploading, setUploading] = useState(false)
  const [results, setResults] = useState<{
    matched: number
    total: number
    errors: string[]
  }>({ matched: 0, total: 0, errors: [] })

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true)
    setResults({ matched: 0, total: acceptedFiles.length, errors: [] })

    try {
      const formData = new FormData()
      acceptedFiles.forEach(file => {
        formData.append('images', file)
      })

      const response = await fetch('/api/upload-images-bulk', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      
      if (data.success) {
        setResults({
          matched: data.matched,
          total: data.total,
          errors: data.errors
        })
      } else {
        setResults({
          matched: 0,
          total: acceptedFiles.length,
          errors: [data.error || 'Upload failed']
        })
      }
    } catch (error) {
      setResults({
        matched: 0,
        total: acceptedFiles.length,
        errors: ['Network error during upload']
      })
    } finally {
      setUploading(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp']
    },
    multiple: true
  })

  return (
    <div className="min-h-screen bg-beige p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-anthracite mb-8">
          Bulk Image Upload 📸
        </h1>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-oak bg-oak/5' : 'border-gray-300 hover:border-oak'}`}
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <p className="text-lg">Drop the images here...</p>
            ) : (
              <div>
                <p className="text-lg mb-2">Drag & drop your EAN-named images here</p>
                <p className="text-sm text-gray-600">
                  or click to select files (e.g., 8718475600800_m.jpg)
                </p>
              </div>
            )}
          </div>
        </div>

        {uploading && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-oak mr-3"></div>
              <p>Uploading and matching images...</p>
            </div>
          </div>
        )}

        {results.total > 0 && !uploading && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Upload Results</h2>
            <div className="mb-4">
              <p className="text-lg">
                ✅ <strong>{results.matched}</strong> images matched to products
              </p>
              <p className="text-gray-600">
                out of {results.total} total images
              </p>
            </div>
            
            {results.errors.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Issues:</h3>
                <ul className="text-sm text-red-600">
                  {results.errors.map((error, i) => (
                    <li key={i}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
