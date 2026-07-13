import { describe, expect, it } from 'vitest'
import { getElementBounds, resolveSnapPosition } from '@/lib/services/overlay-editor'

describe('overlay editor helpers', () => {
  it('calculates element bounds from position and size', () => {
    expect(getElementBounds({ x: 10, y: 20, width: 100, height: 50 })).toMatchObject({
      left: 10,
      centerX: 60,
      right: 110,
      top: 20,
      centerY: 45,
      bottom: 70,
    })
  })

  it('snaps moving elements to the canvas left edge', () => {
    const result = resolveSnapPosition({
      overlay: { width: 1920, height: 1080 },
      movingElement: { id: 'moving', x: 0, y: 0, width: 100, height: 100 },
      elements: [],
      nextX: 6,
      nextY: 50,
      zoom: 1,
    })

    expect(result.x).toBe(0)
    expect(result.guides).toContainEqual(expect.objectContaining({
      orientation: 'vertical',
      position: 0,
    }))
  })
})
