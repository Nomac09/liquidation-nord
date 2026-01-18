// components/ImageGallery.tsx
'use client'

import Image from 'next/image'
import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ImageGalleryProps {
  photos: string[]
  name: string
}

export default function ImageGallery({ photos, name }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length)
  }

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length)
  }

  if (photos.length === 0) {
    return (
      <div className="aspect-[4/3] bg-beige flex items-center justify-center rounded-lg">
        <span className="text-warm-gray">Pas d'image disponible</span>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="aspect-[4/3] relative rounded-lg overflow-hidden">
        <Image
          src={photos[currentIndex]}
          alt={`${name} - Image ${currentIndex + 1}`}
          fill
          className="object-cover"
        />
        
        {photos.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 p-2 rounded-full hover:bg-opacity-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 p-2 rounded-full hover:bg-opacity-100"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {photos.length > 1 && (
        <div className="flex gap-2 mt-4 justify-center">
          {photos.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full ${
                index === currentIndex ? 'bg-oak' : 'bg-warm-gray'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}