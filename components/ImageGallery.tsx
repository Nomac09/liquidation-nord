'use client'

import { useState } from 'react'

interface ImageGalleryProps {
  photos?: any[]
  productName?: string
  name?: string // Alternative prop name
}

export default function ImageGallery({ photos = [], productName, name }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const displayName = productName || name || 'Product'

  // Ensure photos is an array
  const validPhotos = Array.isArray(photos) ? photos.filter(Boolean) : []

  if (validPhotos.length === 0) {
    return (
      <div className="aspect-[4/3] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="text-6xl mb-4">📷</div>
          <p className="text-lg">Pas d'image disponible</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Main image */}
      <div className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
        <img
          src={validPhotos[selectedImage]}
          alt={`${displayName} - Image ${selectedImage + 1}`}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Thumbnail gallery */}
      {validPhotos.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {validPhotos.map((photo, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`aspect-square bg-gray-100 rounded overflow-hidden border-2 ${
                selectedImage === index ? 'border-oak' : 'border-transparent'
              } hover:border-oak transition-colors`}
            >
              <img
                src={photo}
                alt={`${displayName} - Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
