const SNAP_SCREEN_THRESHOLD = 8

export function createCanvasBounds(width, height) {
  return { x: 0, y: 0, width, height }
}

export function getElementBounds(element, x = element.x, y = element.y) {
  return {
    left: x,
    centerX: x + element.width / 2,
    right: x + element.width,
    top: y,
    centerY: y + element.height / 2,
    bottom: y + element.height,
    width: element.width,
    height: element.height,
  }
}

function buildGuide(orientation, position, start, end) {
  return {
    orientation,
    position,
    start: Math.min(start, end),
    end: Math.max(start, end),
  }
}

export function resolveSnapPosition({ overlay, movingElement, elements, nextX, nextY, zoom }) {
  const movingBounds = getElementBounds(movingElement, nextX, nextY)
  const snapThreshold = SNAP_SCREEN_THRESHOLD / Math.max(zoom || 1, 0.1)
  const comparisons = [
    { id: 'canvas', bounds: getElementBounds(createCanvasBounds(overlay.width, overlay.height)) },
    ...elements
      .filter((element) => element.id !== movingElement.id && element.visible !== false)
      .map((element) => ({ id: element.id, bounds: getElementBounds(element) })),
  ]

  const matches = {
    x: null,
    y: null,
  }

  const xPairs = [
    ['left', 'left'],
    ['centerX', 'centerX'],
    ['right', 'right'],
  ]
  const yPairs = [
    ['top', 'top'],
    ['centerY', 'centerY'],
    ['bottom', 'bottom'],
  ]

  for (const comparison of comparisons) {
    for (const [movingKey, targetKey] of xPairs) {
      const delta = comparison.bounds[targetKey] - movingBounds[movingKey]
      if (Math.abs(delta) > snapThreshold) continue
      if (!matches.x || Math.abs(delta) < Math.abs(matches.x.delta)) {
        matches.x = {
          delta,
          target: comparison,
          movingKey,
          targetKey,
        }
      }
    }

    for (const [movingKey, targetKey] of yPairs) {
      const delta = comparison.bounds[targetKey] - movingBounds[movingKey]
      if (Math.abs(delta) > snapThreshold) continue
      if (!matches.y || Math.abs(delta) < Math.abs(matches.y.delta)) {
        matches.y = {
          delta,
          target: comparison,
          movingKey,
          targetKey,
        }
      }
    }
  }

  const snappedX = matches.x ? Math.round(nextX + matches.x.delta) : nextX
  const snappedY = matches.y ? Math.round(nextY + matches.y.delta) : nextY
  const snappedBounds = getElementBounds(movingElement, snappedX, snappedY)
  const guides = []

  if (matches.x) {
    const targetBounds = matches.x.target.bounds
    const position = targetBounds[matches.x.targetKey]
    const verticalStart = matches.x.target.id === 'canvas'
      ? 0
      : Math.min(targetBounds.top, snappedBounds.top)
    const verticalEnd = matches.x.target.id === 'canvas'
      ? overlay.height
      : Math.max(targetBounds.bottom, snappedBounds.bottom)

    guides.push(buildGuide('vertical', position, verticalStart, verticalEnd))
  }

  if (matches.y) {
    const targetBounds = matches.y.target.bounds
    const position = targetBounds[matches.y.targetKey]
    const horizontalStart = matches.y.target.id === 'canvas'
      ? 0
      : Math.min(targetBounds.left, snappedBounds.left)
    const horizontalEnd = matches.y.target.id === 'canvas'
      ? overlay.width
      : Math.max(targetBounds.right, snappedBounds.right)

    guides.push(buildGuide('horizontal', position, horizontalStart, horizontalEnd))
  }

  return {
    x: snappedX,
    y: snappedY,
    guides,
  }
}
