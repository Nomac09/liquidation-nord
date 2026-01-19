'use client'

import { useState } from 'react'

export default function BulkImageUpload() {
  const [uploading, setUploading] = useState(false)
  const [results, setResults] = useState({
    matched: 0,
    total: 0,
    errors: [] as string[]
  })
  const [currentBatch, setCurrentBatch] = useState(0)

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    console.log(`Selected ${files.length} files, total size: ${Array.from(files).reduce((sum, file) => sum + file.size, 0) / 1024 / 1024} MB`)

    setUploading(true)
    setResults({ matched: 0, total: files.length, errors: [] })
    setCurrentBatch(0)

    try {
      // Process files in batches of 10 to avoid payload size limits
      const batchSize = 10
      let totalMatched = 0
      let totalErrors = [] as string[]

      for (let i = 0; i < files.length; i += batchSize) {
        const batch = Array.from(files).slice(i, i + batchSize)
        console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(files.length / batchSize)} (${batch.length} files)`)
        
        setCurrentBatch(Math.floor(i / batchSize) + 1)

        const formData = new FormData()
        batch.forEach(file => {
          formData.append('images', file)
        })

        const response = await fetch('/api/upload-images-bulk', {
          method: 'POST',
          body: formData
        })

        const responseText = await response.text()
        
        if (!response.ok) {
          if (response.status === 413) {
            totalErrors.push(`Batch ${Math.floor(i / batchSize) + 1}: Files too large, try smaller batches`)
          } else {
            totalErrors.push(`Batch ${Math.floor(i / batchSize) + 1}: HTTP ${response.status} - ${responseText.slice(0, 100)}`)
          }
          continue
        }

        let data
        try {
          data = JSON.parse(responseText)
          if (data.success) {
            totalMatched += data.matched
            totalErrors.push(...data.errors)
          }
        } catch (e) {
          totalErrors.push(`Batch ${Math.floor(i / batchSize) + 1}: Invalid response`)
        }
      }

      setResults({
        matched: totalMatched,
        total: files.length,
        errors: totalErrors
      })

    } catch (error) {
      setResults({
        matched: 0,
        total: files.length,
        errors: [`Network error: ${error instanceof Error ? error.message : String(error)}`]
      })
    } finally {
      setUploading(false)
      setCurrentBatch(0)
    }
  }

  return (
    <div className="min-h-screen bg-beige p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-anthracite mb-8">
          Bulk Image Upload 📸
        </h1>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800">
              💡 <strong>Tip:</strong> Files are processed in batches of 10 to avoid size limits. 
              Total size: <span id="total-size">0</span> MB
            </p>
          </div>
          
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
                  <p>Processing batch {currentBatch}...</p>
                </div>
              ) : (
                <div>
                  <p className="text-lg mb-2">Click to select EAN-named images</p>
                  <p className="text-sm text-gray-600">
                    or drag & drop files (e.g., 8718475600800_m.jpg)
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Processing in batches of 10 files
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
                <ul className="text-sm text-red-600 max-h-40 overflow-y-auto">
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
