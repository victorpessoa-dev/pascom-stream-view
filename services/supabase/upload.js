import { createSupabaseBrowserClient } from '@/services/supabase/browser'

const BUCKET = 'pascom-media'

function sanitizeFileName(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .toLowerCase()
}

export async function uploadMedia(file, folder = 'uploads') {
  if (!file) return ''

  const supabase = createSupabaseBrowserClient()
  const extension = file.name.includes('.') ? file.name.split('.').pop() : 'bin'
  const safeName = sanitizeFileName(file.name || `media.${extension}`)
  const path = `${folder}/${crypto.randomUUID()}-${safeName}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: '31536000',
      upsert: false,
      contentType: file.type || undefined,
    })

  if (error) throw error

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}
