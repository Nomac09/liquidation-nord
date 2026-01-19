'use client'

import { useState } from 'react'
import Image from 'next/image'

interface ImageGalleryProps {
  photos: string[]
  productName: string
}

export default function ImageGallery({ photos, productName }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0)

  if (!photos || photos.length === 0) {
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
          src={photos[selectedImage]}
          alt={`${productName} - Image ${selectedImage + 1}`}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Thumbnail gallery */}
      {photos.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {photos.map((photo, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`aspect-square bg-gray-100 rounded overflow-hidden border-2 ${
                selectedImage === index ? 'border-oak' : 'border-transparent'
              } hover:border-oak transition-colors`}
            >
              <img
                src={photo}
                alt={`${productName} - Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
