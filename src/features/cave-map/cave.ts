export type { CaveMap, CaveTile, Direction, Point } from './cave/grid';
export { DIRECTIONS, isFloor } from './cave/grid';

import {
  carveBrush,
  clamp,
  findNearestFloor,
  type CaveMap,
  type Point,
} from './cave/grid';
import { createSeededRandom } from './cave/random';

type Chamber = {
  x: number;
  y: number;
  radius: number;
};

export function generateCaveMap(seed: string, width: number, height: number): CaveMap {
  const random = createSeededRandom(seed);
  const tiles = new Uint8Array(width * height);
  tiles.fill(1);

  const floorCells: Point[] = [];
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  const chambers = createChambers(width, height, random);

  let floorCount = 0;
  for (const chamber of chambers) {
    floorCount += carveChamber(tiles, width, height, chamber, floorCells, random);
  }

  connectChambers(tiles, width, height, chambers, floorCells, random);
  floorCount = floorCells.length;

  const entry = findNearestFloor(tiles, width, height, centerX, centerY) ?? chambers[0] ?? {
    x: centerX,
    y: centerY,
  };

  return {
    seed,
    width,
    height,
    tiles,
    floorCount,
    floorRatio: floorCount / (width * height),
    entry,
  };
}

function createChambers(width: number, height: number, random: () => number) {
  const count = 7 + Math.floor(random() * 2);
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  const minDistance = Math.max(10, Math.floor(Math.min(width, height) * 0.14));
  const chambers: Chamber[] = [];
  let attempts = 0;

  chambers.push({
    x: centerX,
    y: centerY,
    radius: 4 + Math.floor(random() * 2),
  });

  while (chambers.length < count && attempts < count * 80) {
    attempts += 1;
    const radius = 3 + Math.floor(random() * 3);
    const x = clamp(Math.round(width * (0.16 + random() * 0.68)), 4, width - 5);
    const y = clamp(Math.round(height * (0.16 + random() * 0.68)), 4, height - 5);

    let valid = true;
    for (const chamber of chambers) {
      const dx = chamber.x - x;
      const dy = chamber.y - y;
      const distance = Math.hypot(dx, dy);
      if (distance < minDistance + chamber.radius + radius) {
        valid = false;
        break;
      }
    }

    if (!valid) {
      continue;
    }

    chambers.push({ x, y, radius });
  }

  return chambers;
}

function carveChamber(
  tiles: Uint8Array,
  width: number,
  height: number,
  chamber: Chamber,
  floorCells: Point[],
  random: () => number,
) {
  let carved = 0;
  carved += carveBrush(tiles, width, height, chamber.x, chamber.y, chamber.radius, floorCells);

  const satelliteCount = 1 + Math.floor(random() * 2);
  for (let i = 0; i < satelliteCount; i += 1) {
    const angle = random() * Math.PI * 2;
    const offset = chamber.radius + 1 + Math.floor(random() * 2);
    carved += carveBrush(
      tiles,
      width,
      height,
      chamber.x + Math.round(Math.cos(angle) * offset * 0.7),
      chamber.y + Math.round(Math.sin(angle) * offset * 0.7),
      1 + Math.floor(random() * 2),
      floorCells,
    );
  }

  return carved;
}

function connectChambers(
  tiles: Uint8Array,
  width: number,
  height: number,
  chambers: Chamber[],
  floorCells: Point[],
  random: () => number,
) {
  if (chambers.length <= 1) {
    return;
  }

  const connected = new Set<number>();
  connected.add(0);

  while (connected.size < chambers.length) {
    let bestFrom = 0;
    let bestTo = 0;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (const fromIndex of connected) {
      const from = chambers[fromIndex]!;
      for (let toIndex = 0; toIndex < chambers.length; toIndex += 1) {
        if (connected.has(toIndex)) {
          continue;
        }
        const to = chambers[toIndex]!;
        const distance = distanceSquared(from.x, from.y, to.x, to.y) + random() * 0.001;
        if (distance < bestDistance) {
          bestDistance = distance;
          bestFrom = fromIndex;
          bestTo = toIndex;
        }
      }
    }

    carveTunnel(
      tiles,
      width,
      height,
      chambers[bestFrom]!,
      chambers[bestTo]!,
      floorCells,
    );
    connected.add(bestTo);
  }
}

function carveTunnel(
  tiles: Uint8Array,
  width: number,
  height: number,
  start: Chamber,
  target: Chamber,
  floorCells: Point[],
) {
  const path = findTunnelPath(tiles, width, height, start, target);
  if (path.length === 0) {
    carveBrush(tiles, width, height, target.x, target.y, target.radius + 1, floorCells);
    return;
  }

  for (const point of path) {
    carveBrush(tiles, width, height, point.x, point.y, 1, floorCells);
  }

  carveBrush(tiles, width, height, target.x, target.y, target.radius + 1, floorCells);
}

function distanceSquared(ax: number, ay: number, bx: number, by: number) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

function findTunnelPath(
  tiles: Uint8Array,
  width: number,
  height: number,
  start: Chamber,
  target: Chamber,
) {
  const startIndex = start.y * width + start.x;
  const targetIndex = target.y * width + target.x;
  const size = width * height;
  const distances = new Float64Array(size);
  distances.fill(Number.POSITIVE_INFINITY);
  const previous = new Int32Array(size);
  previous.fill(-1);
  const open: number[] = [startIndex];
  const inOpen = new Uint8Array(size);
  inOpen[startIndex] = 1;
  distances[startIndex] = 0;

  while (open.length > 0) {
    let bestOpenIndex = 0;
    let bestIndex = open[0]!;
    let bestDistance = distances[bestIndex] ?? Number.POSITIVE_INFINITY;
    for (let i = 1; i < open.length; i += 1) {
      const candidateIndex = open[i]!;
      const candidateDistance = distances[candidateIndex] ?? Number.POSITIVE_INFINITY;
      if (candidateDistance < bestDistance) {
        bestDistance = candidateDistance;
        bestIndex = candidateIndex;
        bestOpenIndex = i;
      }
    }

    open.splice(bestOpenIndex, 1);
    inOpen[bestIndex] = 0;

    if (bestIndex === targetIndex) {
      break;
    }

    const x = bestIndex % width;
    const y = Math.floor(bestIndex / width);
    for (const neighbor of [
      { x: x + 1, y },
      { x: x - 1, y },
      { x, y: y + 1 },
      { x, y: y - 1 },
    ]) {
      if (neighbor.x < 1 || neighbor.y < 1 || neighbor.x >= width - 1 || neighbor.y >= height - 1) {
        continue;
      }

      const neighborIndex = neighbor.y * width + neighbor.x;
      const terrainCost = tiles[neighborIndex] === 1 ? 1 : 14;
      const newDistance = (distances[bestIndex] ?? Number.POSITIVE_INFINITY) + terrainCost;
      const existingDistance = distances[neighborIndex] ?? Number.POSITIVE_INFINITY;
      if (newDistance >= existingDistance) {
        continue;
      }

      distances[neighborIndex] = newDistance;
      previous[neighborIndex] = bestIndex;
      if (!inOpen[neighborIndex]) {
        open.push(neighborIndex);
        inOpen[neighborIndex] = 1;
      }
    }
  }

  if (!Number.isFinite(distances[targetIndex])) {
    return carveFallbackTunnel(width, start, target);
  }

  const path: Point[] = [];
  let cursor = targetIndex;
  while (cursor !== -1 && cursor !== startIndex) {
    path.push({
      x: cursor % width,
      y: Math.floor(cursor / width),
    });
    cursor = previous[cursor] ?? -1;
  }

  path.reverse();
  return path;
}

function carveFallbackTunnel(width: number, start: Chamber, target: Chamber) {
  const path: Point[] = [];
  let x = start.x;
  let y = start.y;
  while (x !== target.x || y !== target.y) {
    if (x !== target.x) {
      x += x < target.x ? 1 : -1;
    } else if (y !== target.y) {
      y += y < target.y ? 1 : -1;
    }
    path.push({ x, y });
    if (path.length > width * 2) {
      break;
    }
  }
  return path;
}
