// What stops movement in the free-coordinate world.
//
// The movement code only asks one question: "can something travel in a straight line from A to B?"
// How the map stores terrain, walls, cliffs and slopes is hidden behind this interface, so the real
// map format can be designed later without changing the movement code.

export interface MovementBlocker {
  /** True if the straight path from (fromX, fromY) to (toX, toY) leaves the map or touches anything solid. */
  isPathBlocked(fromX: number, fromY: number, toX: number, toY: number): boolean;
}

/** The playable area: a rectangle in world units. */
export interface MapBounds {
  minX: number; maxX: number;
  minY: number; maxY: number;
}

/** A solid axis-aligned rectangle (a wall, a building footprint, a rock...). */
export interface SolidBox {
  minX: number; maxX: number;
  minY: number; maxY: number;
}

/**
 * A simple MovementBlocker made of map bounds plus solid rectangles.
 * PLACEHOLDER: good enough for tests and early prototypes. The real terrain model
 * (cliffs, steep slopes, heights) still needs to be designed.
 */
export class BoxMovementBlocker implements MovementBlocker {
  constructor(private readonly bounds: MapBounds, private readonly solids: readonly SolidBox[]) {}

  isPathBlocked(fromX: number, fromY: number, toX: number, toY: number): boolean {
    if (!isInsideBounds(this.bounds, toX, toY)) return true;
    return this.solids.some(box => segmentTouchesBox(fromX, fromY, toX, toY, box));
  }
}

/** Inclusive check: a point exactly on the border still counts as inside. */
export function isInsideBounds(bounds: MapBounds, x: number, y: number): boolean {
  return x >= bounds.minX && x <= bounds.maxX && y >= bounds.minY && y <= bounds.maxY;
}

/**
 * Does the line segment from (x0, y0) to (x1, y1) touch the box?
 * Method: write the segment as P(t) = start + t * (end - start), with t from 0 to 1.
 * For each axis, find the range of t where the segment is between the box's two sides on that axis.
 * The segment touches the box only if those two t-ranges overlap.
 */
export function segmentTouchesBox(x0: number, y0: number, x1: number, y1: number, box: SolidBox): boolean {
  const xRange = axisEntryExit(x0, x1 - x0, box.minX, box.maxX);
  const yRange = axisEntryExit(y0, y1 - y0, box.minY, box.maxY);
  if (!xRange || !yRange) return false;
  const enter = Math.max(xRange[0], yRange[0], 0);
  const exit = Math.min(xRange[1], yRange[1], 1);
  return enter <= exit;
}

/**
 * On one axis, the t-range [tEnter, tExit] during which start + t * change lies between low and high.
 * Returns null if the segment never gets between them.
 */
function axisEntryExit(start: number, change: number, low: number, high: number): [number, number] | null {
  if (change === 0) {
    // Not moving on this axis: either always inside the band or never.
    return start >= low && start <= high ? [-Infinity, Infinity] : null;
  }
  const tLow = (low - start) / change;
  const tHigh = (high - start) / change;
  return [Math.min(tLow, tHigh), Math.max(tLow, tHigh)];
}
