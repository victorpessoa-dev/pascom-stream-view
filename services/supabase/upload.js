import { createSupabaseBrowserClient } from '@/services/supabase/browser'

const BUCKET = 'pascom-media'
const MAX_UPLOAD_SIZE_BYTES = 100 * 1024 * 1024
const ALLOWED_MEDIA_TYPES = new Set([
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/webm',
])
const CONVERTIBLE_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const WEBP_QUALITY = 0.86
const MAX_IMAGE_SIDE = 2560

export function sanitizeFileName(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .toLowerCase()
}

export function validateMediaFile(file) {
  if (!file) return

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    throw new Error('Arquivo maior que 100MB')
  }

  if (!file.type || !ALLOWED_MEDIA_TYPES.has(file.type)) {
    throw new Error('Tipo de arquivo não permitido')
  }
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
        return
      }

      reject(new Error('Não foi possível otimizar a imagem'))
    }, type, quality)
  })
}

async function loadImageBitmap(file) {
  if ('createImageBitmap' in window) {
    return createImageBitmap(file)
  }

  const image = new Image()
  const url = URL.createObjectURL(file)

  try {
    await new Promise((resolve, reject) => {
      image.onload = resolve
      image.onerror = reject
      image.src = url
    })

    return image
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function optimizeImageForUpload(file) {
  if (!CONVERTIBLE_IMAGE_TYPES.has(file.type)) return file

  const bitmap = await loadImageBitmap(file)
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')

  canvas.width = width
  canvas.height = height
  canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height)

  const blob = await canvasToBlob(canvas, 'image/webp', WEBP_QUALITY)
  const originalName = file.name.replace(/\.[^.]+$/, '')
  const optimizedName = `${originalName || 'image'}.webp`
  const optimizedFile = new File([blob], optimizedName, {
    type: 'image/webp',
    lastModified: file.lastModified,
  })

  return optimizedFile.size < file.size || file.type !== 'image/webp'
    ? optimizedFile
    : file
}

export async function uploadMedia(file, folder = 'uploads') {
  if (!file) return ''
  validateMediaFile(file)
  const optimizedFile = await optimizeImageForUpload(file)
  validateMediaFile(optimizedFile)

  const supabase = createSupabaseBrowserClient()
  const extension = optimizedFile.name.includes('.') ? optimizedFile.name.split('.').pop() : 'bin'
  const safeName = sanitizeFileName(optimizedFile.name || `media.${extension}`)
  const path = `${folder}/${crypto.randomUUID()}-${safeName}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, optimizedFile, {
      cacheControl: '31536000',
      upsert: false,
      contentType: optimizedFile.type || undefined,
    })

  if (error) throw error

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}
