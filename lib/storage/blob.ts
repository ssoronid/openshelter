/**
 * Utilidades para Vercel Blob Storage
 * 
 * Esta utilidad proporciona funciones para subir, obtener y eliminar
 * archivos usando Vercel Blob Storage.
 * 
 * Requisitos:
 * - Variable de entorno BLOB_READ_WRITE_TOKEN configurada en Vercel
 * - @vercel/blob instalado como dependencia
 * 
 * Uso:
 *   import { uploadFile, getFileUrl, deleteFile } from '@/lib/storage/blob'
 */

import { put, head, del, list } from '@vercel/blob'

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.warn(
    '⚠️  BLOB_READ_WRITE_TOKEN no está configurado. ' +
    'Vercel Blob Storage no estará disponible. ' +
    'Crea un Blob Store en el dashboard de Vercel para habilitarlo.'
  )
}

/**
 * Sube un archivo a Vercel Blob Storage
 * 
 * @param file - Archivo a subir (File, Blob, o Buffer)
 * @param pathname - Ruta donde se guardará el archivo (ej: 'animals/photo-123.jpg')
 * @param options - Opciones adicionales (contentType, access, etc.)
 * @returns URL del archivo subido
 * 
 * @example
 * ```ts
 * const formData = new FormData()
 * formData.append('file', file)
 * const file = formData.get('file') as File
 * 
 * const url = await uploadFile(file, `animals/${animalId}/${Date.now()}.jpg`, {
 *   contentType: file.type,
 *   access: 'public'
 * })
 * ```
 */
export async function uploadFile(
  file: File | Blob | Buffer,
  pathname: string,
  options?: {
    contentType?: string
    access?: 'public' | 'private'
    addRandomSuffix?: boolean
  }
): Promise<string> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      'BLOB_READ_WRITE_TOKEN no está configurado. ' +
      'Crea un Blob Store en el dashboard de Vercel.'
    )
  }

  try {
    const blob = await put(pathname, file, {
      access: options?.access || 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: options?.contentType,
      addRandomSuffix: options?.addRandomSuffix ?? false,
    })

    return blob.url
  } catch (error) {
    console.error('Error subiendo archivo a Vercel Blob:', error)
    throw new Error('Error al subir archivo')
  }
}

/**
 * Obtiene la URL de un archivo en Vercel Blob Storage
 * 
 * @param url - URL completa del blob (retornada por uploadFile)
 * @returns URL del archivo
 * 
 * @example
 * ```ts
 * const fileUrl = getFileUrl('https://xxx.public.blob.vercel-storage.com/animals/photo.jpg')
 * ```
 */
export function getFileUrl(url: string): string {
  return url
}

/**
 * Verifica si un archivo existe en Vercel Blob Storage
 * 
 * @param url - URL completa del blob
 * @returns true si el archivo existe, false en caso contrario
 * 
 * @example
 * ```ts
 * const exists = await fileExists('https://xxx.public.blob.vercel-storage.com/animals/photo.jpg')
 * ```
 */
export async function fileExists(url: string): Promise<boolean> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return false
  }

  try {
    await head(url, {
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })
    return true
  } catch (error) {
    return false
  }
}

/**
 * Elimina un archivo de Vercel Blob Storage
 * 
 * @param url - URL completa del blob a eliminar
 * @returns true si se eliminó correctamente, false en caso contrario
 * 
 * @example
 * ```ts
 * await deleteFile('https://xxx.public.blob.vercel-storage.com/animals/photo.jpg')
 * ```
 */
export async function deleteFile(url: string): Promise<boolean> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      'BLOB_READ_WRITE_TOKEN no está configurado. ' +
      'Crea un Blob Store en el dashboard de Vercel.'
    )
  }

  try {
    await del(url, {
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })
    return true
  } catch (error) {
    console.error('Error eliminando archivo de Vercel Blob:', error)
    return false
  }
}

/**
 * Lista archivos en Vercel Blob Storage
 * 
 * @param prefix - Prefijo para filtrar archivos (ej: 'animals/')
 * @param options - Opciones adicionales (limit, cursor, etc.)
 * @returns Lista de blobs
 * 
 * @example
 * ```ts
 * const files = await listFiles('animals/', { limit: 100 })
 * ```
 */
export async function listFiles(
  prefix?: string,
  options?: {
    limit?: number
    cursor?: string
  }
) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      'BLOB_READ_WRITE_TOKEN no está configurado. ' +
      'Crea un Blob Store en el dashboard de Vercel.'
    )
  }

  try {
    const result = await list({
      prefix,
      limit: options?.limit || 1000,
      cursor: options?.cursor,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    return result
  } catch (error) {
    console.error('Error listando archivos de Vercel Blob:', error)
    throw new Error('Error al listar archivos')
  }
}

/**
 * Valida que un archivo sea una imagen válida
 * 
 * @param file - Archivo a validar
 * @param maxSizeMB - Tamaño máximo en MB (default: 5MB)
 * @returns true si es válido, lanza error si no
 * 
 * @example
 * ```ts
 * validateImageFile(file, 10) // Máximo 10MB
 * ```
 */
export function validateImageFile(
  file: File,
  maxSizeMB: number = 5
): void {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  const maxSizeBytes = maxSizeMB * 1024 * 1024

  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      `Tipo de archivo no permitido. Solo se permiten: ${allowedTypes.join(', ')}`
    )
  }

  if (file.size > maxSizeBytes) {
    throw new Error(
      `El archivo es demasiado grande. Tamaño máximo: ${maxSizeMB}MB`
    )
  }
}

