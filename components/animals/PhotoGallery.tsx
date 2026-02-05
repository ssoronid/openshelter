'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Photo {
  id: string
  url: string
  isPrimary: boolean
}

interface Props {
  photos: Photo[]
  animalName: string
}

export default function PhotoGallery({ photos, animalName }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  if (photos.length === 0) {
    return (
      <div className="bg-muted h-64 md:h-96 flex items-center justify-center rounded-lg">
        <p className="text-muted-foreground">📷 Sin fotos disponibles</p>
      </div>
    )
  }

  const primaryPhoto = photos.find((p) => p.isPrimary) || photos[0]
  const otherPhotos = photos.filter((p) => p.id !== primaryPhoto.id)

  const handlePrev = () => {
    if (selectedIndex === null) return
    setSelectedIndex(selectedIndex === 0 ? photos.length - 1 : selectedIndex - 1)
  }

  const handleNext = () => {
    if (selectedIndex === null) return
    setSelectedIndex(selectedIndex === photos.length - 1 ? 0 : selectedIndex + 1)
  }

  return (
    <>
      {/* Main gallery */}
      <div className="space-y-2">
        {/* Primary photo */}
        <div
          className="relative cursor-pointer rounded-lg overflow-hidden"
          onClick={() => setSelectedIndex(photos.indexOf(primaryPhoto))}
        >
          <img
            src={primaryPhoto.url}
            alt={`Foto principal de ${animalName}`}
            className="w-full h-64 md:h-96 object-cover"
          />
        </div>

        {/* Thumbnail row */}
        {otherPhotos.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {otherPhotos.map((photo, index) => (
              <div
                key={photo.id}
                className="flex-shrink-0 cursor-pointer rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-colors"
                onClick={() => setSelectedIndex(photos.indexOf(photo))}
              >
                <img
                  src={photo.url}
                  alt={`Foto ${index + 2} de ${animalName}`}
                  className="w-20 h-20 object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setSelectedIndex(null)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={() => setSelectedIndex(null)}
          >
            <X className="h-6 w-6" />
          </Button>

          {photos.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation()
                  handlePrev()
                }}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation()
                  handleNext()
                }}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}

          <img
            src={photos[selectedIndex].url}
            alt={`Foto de ${animalName}`}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <div className="absolute bottom-4 text-white text-sm">
            {selectedIndex + 1} / {photos.length}
          </div>
        </div>
      )}
    </>
  )
}



