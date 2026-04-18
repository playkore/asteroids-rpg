export type CaveTile = 0 | 1;

export type Point = {
  x: number;
  y: number;
};

export type Direction = 0 | 1 | 2 | 3;

export type CaveMap = {
  seed: string;
  width: number;
  height: number;
  tiles: Uint8Array;
  floorCount: number;
  floorRatio: number;
  entry: Point;
};

export const DIRECTIONS: Record<Direction, Point> = {
  0: { x: 1, y: 0 },
  1: { x: 0, y: 1 },
  2: { x: -1, y: 0 },
  3: { x: 0, y: -1 },
};

export function isFloor(map: CaveMap, x: number, y: number) {
  if (x < 0 || y < 0 || x >= map.width || y >= map.height) {
    return false;
  }
  return map.tiles[y * map.width + x] === 0;
}

export function carveBrush(
  tiles: Uint8Array,
  width: number,
  height: number,
  centerX: number,
  centerY: number,
  radius: number,
  floorCells: Point[],
) {
  let carved = 0;
  for (let y = -radius; y <= radius; y += 1) {
    for (let x = -radius; x <= radius; x += 1) {
      if (x * x + y * y > radius * radius + 0.35) {
        continue;
      }
      carved += carveCell(tiles, width, height, centerX + x, centerY + y, floorCells);
    }
  }
  return carved;
}

export function carveCell(
  tiles: Uint8Array,
  width: number,
  height: number,
  x: number,
  y: number,
  floorCells: Point[],
) {
  if (x < 0 || y < 0 || x >= width || y >= height) {
    return 0;
  }

  const index = y * width + x;
  if (tiles[index] === 0) {
    return 0;
  }

  tiles[index] = 0;
  floorCells.push({ x, y });
  return 1;
}

export function neighbors(x: number, y: number) {
  return [
    { x: x + 1, y },
    { x: x - 1, y },
    { x, y: y + 1 },
    { x, y: y - 1 },
  ];
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function countFloorNeighbors(tiles: Uint8Array, width: number, height: number, x: number, y: number) {
  let count = 0;
  for (const neighbor of neighbors(x, y)) {
    if (neighbor.x < 0 || neighbor.y < 0 || neighbor.x >= width || neighbor.y >= height) {
      continue;
    }
    if (tiles[neighbor.y * width + neighbor.x] === 0) {
      count += 1;
    }
  }
  return count;
}

export function hasSolidNeighbor(tiles: Uint8Array, width: number, height: number, x: number, y: number) {
  for (const neighbor of neighbors(x, y)) {
    if (neighbor.x < 0 || neighbor.y < 0 || neighbor.x >= width || neighbor.y >= height) {
      continue;
    }
    if (tiles[neighbor.y * width + neighbor.x] === 1) {
      return true;
    }
  }
  return false;
}

export function pickFrontierCell(
  floorCells: Point[],
  tiles: Uint8Array,
  width: number,
  height: number,
  random: () => number,
) {
  if (floorCells.length === 0) {
    return null;
  }

  const attempts = Math.min(24, floorCells.length);
  for (let i = 0; i < attempts; i += 1) {
    const candidate = floorCells[Math.floor(random() * floorCells.length)] ?? null;
    if (!candidate) {
      continue;
    }
    if (hasSolidNeighbor(tiles, width, height, candidate.x, candidate.y)) {
      return candidate;
    }
  }

  for (let i = floorCells.length - 1; i >= 0 && i >= floorCells.length - 64; i -= 1) {
    const candidate = floorCells[i];
    if (!candidate) {
      continue;
    }
    if (hasSolidNeighbor(tiles, width, height, candidate.x, candidate.y)) {
      return candidate;
    }
  }

  return null;
}

export function findNearestFloor(
  tiles: Uint8Array,
  width: number,
  height: number,
  startX: number,
  startY: number,
) {
  const visited = new Uint8Array(width * height);
  const queue: Point[] = [{ x: startX, y: startY }];
  visited[startY * width + startX] = 1;

  while (queue.length > 0) {
    const point = queue.shift()!;
    if (tiles[point.y * width + point.x] === 0) {
      return point;
    }

    for (const neighbor of neighbors(point.x, point.y)) {
      if (neighbor.x < 0 || neighbor.y < 0 || neighbor.x >= width || neighbor.y >= height) {
        continue;
      }
      const index = neighbor.y * width + neighbor.x;
      if (visited[index]) {
        continue;
      }
      visited[index] = 1;
      queue.push(neighbor);
    }
  }

  return null;
}
