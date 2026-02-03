'use client'

import { useState, useRef } from 'react'
import { Upload, X, Loader2, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface Photo {
  id: string
  url: string
  isPrimary: boolean
}

interface Props {
  animalId: string
  photos: Photo[]
  onPhotosChange: (photos: Photo[]) => void
  disabled?: boolean
}

export default function PhotoUploader({
  animalId,
  photos,
  onPhotosChange,
  disabled = false,
}: Props) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0 || disabled) return

    setUploading(true)

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('isPrimary', photos.length === 0 ? 'true' : 'false')

        const response = await fetch(`/api/animals/${animalId}/photos`, {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Error al subir foto')
        }

        return response.json()
      })

      const results = await Promise.all(uploadPromises)
      const newPhotos = results.map((r) => r.data)
      onPhotosChange([...photos, ...newPhotos])
    } catch (error) {
      console.error('Error uploading photos:', error)
      alert(error instanceof Error ? error.message : 'Error al subir fotos')
    } finally {
      setUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  const handleDelete = async (photoId: string) => {
    if (disabled) return
    if (!confirm('¿Estás seguro de eliminar esta foto?')) return

    try {
      const response = await fetch(
        `/api/animals/${animalId}/photos?photoId=${photoId}`,
        { method: 'DELETE' }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al eliminar foto')
      }

      onPhotosChange(photos.filter((p) => p.id !== photoId))
    } catch (error) {
      console.error('Error deleting photo:', error)
      alert(error instanceof Error ? error.message : 'Error al eliminar foto')
    }
  }

  const handleSetPrimary = async (photoId: string) => {
    if (disabled) return

    try {
      const response = await fetch(`/api/animals/${animalId}/photos`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al establecer foto principal')
      }

      onPhotosChange(
        photos.map((p) => ({
          ...p,
          isPrimary: p.id === photoId,
        }))
      )
    } catch (error) {
      console.error('Error setting primary photo:', error)
      alert(error instanceof Error ? error.message : 'Error al establecer foto principal')
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFileSelect(e.dataTransfer.files)
  }

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={disabled || uploading}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Subiendo fotos...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                Arrastra fotos aquí o haz clic para seleccionar
              </p>
              <p className="text-xs text-muted-foreground">
                JPG, PNG o WebP. Máximo 5MB por foto
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <Card key={photo.id} className="relative group overflow-hidden">
              <CardContent className="p-0">
                <img
                  src={photo.url}
                  alt="Foto del animal"
                  className="w-full h-32 object-cover"
                />
                {photo.isPrimary && (
                  <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    Principal
                  </div>
                )}
                {!disabled && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {!photo.isPrimary && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSetPrimary(photo.id)
                        }}
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(photo.id)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

