import { describe, expect, it } from 'vitest'
import { sanitizeFileName, validateMediaFile } from '@/services/supabase/upload'

describe('media upload validation', () => {
  it('sanitizes filenames for storage paths', () => {
    expect(sanitizeFileName('Logo São José 2026.PNG')).toBe('logo-sao-jose-2026.png')
  })

  it('accepts allowed media files', () => {
    expect(() => validateMediaFile({
      size: 1024,
      type: 'image/png',
    })).not.toThrow()
  })

  it('rejects unsupported media types', () => {
    expect(() => validateMediaFile({
      size: 1024,
      type: 'application/pdf',
    })).toThrow('Tipo de arquivo não permitido')
  })

  it('rejects files without a media type', () => {
    expect(() => validateMediaFile({
      size: 1024,
      type: '',
    })).toThrow('Tipo de arquivo não permitido')
  })
})
