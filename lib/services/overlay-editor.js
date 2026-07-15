const SNAP_SCREEN_THRESHOLD = 8
const SAFE_AREA_RATIO = 0.05

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
    {
      id: 'safe-area',
      bounds: getElementBounds({
        x: Math.round(overlay.width * SAFE_AREA_RATIO),
        y: Math.round(overlay.height * SAFE_AREA_RATIO),
        width: Math.round(overlay.width * (1 - SAFE_AREA_RATIO * 2)),
        height: Math.round(overlay.height * (1 - SAFE_AREA_RATIO * 2)),
      }),
    },
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
    ['centerX', 'left'],
    ['centerX', 'centerX'],
    ['centerX', 'right'],
    ['right', 'right'],
  ]
  const yPairs = [
    ['top', 'top'],
    ['centerY', 'top'],
    ['centerY', 'centerY'],
    ['centerY', 'bottom'],
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
    const isFrame = matches.x.target.id === 'canvas' || matches.x.target.id === 'safe-area'
    const verticalStart = isFrame ? targetBounds.top : Math.min(targetBounds.top, snappedBounds.top)
    const verticalEnd = isFrame ? targetBounds.bottom : Math.max(targetBounds.bottom, snappedBounds.bottom)

    guides.push(buildGuide('vertical', position, verticalStart, verticalEnd))
  }

  if (matches.y) {
    const targetBounds = matches.y.target.bounds
    const position = targetBounds[matches.y.targetKey]
    const isFrame = matches.y.target.id === 'canvas' || matches.y.target.id === 'safe-area'
    const horizontalStart = isFrame ? targetBounds.left : Math.min(targetBounds.left, snappedBounds.left)
    const horizontalEnd = isFrame ? targetBounds.right : Math.max(targetBounds.right, snappedBounds.right)

    guides.push(buildGuide('horizontal', position, horizontalStart, horizontalEnd))
  }

  return {
    x: snappedX,
    y: snappedY,
    guides,
    safeAreaMatched: matches.x?.target.id === 'safe-area' || matches.y?.target.id === 'safe-area',
  }
}
