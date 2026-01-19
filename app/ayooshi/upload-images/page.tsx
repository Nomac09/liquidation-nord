'use client'

import { useState } from 'react'

export default function BulkImageUpload() {
  const [uploading, setUploading] = useState(false)
  const [results, setResults] = useState({
    matched: 0,
    total: 0,
    errors: [] as string[]
  })

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    console.log(`Selected ${files.length} files`)
    setUploading(true)
    setResults({ matched: 0, total: files.length, errors: [] })

    try {
      const formData = new FormData()
      for (let i = 0; i < files.length; i++) {
        formData.append('images', files[i])
        console.log(`Adding file ${i + 1}: ${files[i].name}`)
      }

      console.log('Sending request to /api/upload-images-bulk...')
      const response = await fetch('/api/upload-images-bulk', {
        method: 'POST',
        body: formData
      })

      console.log('Response status:', response.status)
      const responseText = await response.text()
      console.log('Response text:', responseText)

      let data
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        console.error('Failed to parse JSON:', e)
        setResults({
          matched: 0,
          total: files.length,
          errors: [`Invalid response from server: ${responseText.slice(0, 200)}`]
        })
        return
      }
      
      if (data.success) {
        console.log('Upload successful:', data)
        setResults({
          matched: data.matched,
          total: data.total,
          errors: data.errors
        })
      } else {
        console.log('Upload failed:', data)
        setResults({
          matched: 0,
          total: files.length,
          errors: [data.error || 'Upload failed']
        })
      }
    } catch (error) {
      console.error('Network error:', error)
      setResults({
        matched: 0,
        total: files.length,
        errors: [`Network error: ${error instanceof Error ? error.message : String(error)}`]
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-beige p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-anthracite mb-8">
          Bulk Image Upload 📸
        </h1>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              onChange={handleFileChange}
              className="hidden"
              id="image-upload"
              disabled={uploading}
            />
            <label 
              htmlFor="image-upload" 
              className={`cursor-pointer inline-block p-4 rounded-lg border-2 border-dashed transition-colors
                ${uploading ? 'border-gray-200 text-gray-400' : 'border-gray-300 hover:border-oak hover:bg-oak/5'}`}
            >
              {uploading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-oak mr-3"></div>
                  <p>Uploading...</p>
                </div>
              ) : (
                <div>
                  <p className="text-lg mb-2">Click to select EAN-named images</p>
                  <p className="text-sm text-gray-600">
                    or drag & drop files (e.g., 8718475600800_m.jpg)
                  </p>
                </div>
              )}
            </label>
          </div>
        </div>

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
