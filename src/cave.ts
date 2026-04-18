export type { CaveMap, CaveTile, Direction, Point } from './cave/grid';
export { DIRECTIONS, isFloor } from './cave/grid';

import {
  carveBrush,
  clamp,
  countFloorNeighbors,
  findNearestFloor,
  pickFrontierCell,
  type Direction,
  DIRECTIONS,
  type CaveMap,
  type Point,
} from './cave/grid';
import { createSeededRandom } from './cave/random';

type Worm = {
  x: number;
  y: number;
  direction: Direction;
  steps: number;
  thickness: number;
  stallCount: number;
};

export function generateCaveMap(seed: string, width: number, height: number): CaveMap {
  const random = createSeededRandom(seed);
  const tiles = new Uint8Array(width * height);
  tiles.fill(1);

  const floorCells: Point[] = [];
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);

  let floorCount = carveBrush(tiles, width, height, centerX, centerY, 1, floorCells);
  const targetFloor = Math.floor(width * height * (0.18 + random() * 0.04));

  const worms: Worm[] = [];
  const seedWorms = 4 + Math.floor(random() * 2);
  for (let i = 0; i < seedWorms; i += 1) {
    const anchor = pickFrontierCell(floorCells, tiles, width, height, random) ?? {
      x: centerX,
      y: centerY,
    };
    worms.push({
      x: anchor.x,
      y: anchor.y,
      direction: ((i + Math.floor(random() * 2)) % 4) as Direction,
      steps: Math.floor(width * 0.55 + random() * width * 0.4),
      thickness: 1,
      stallCount: 0,
    });
  }

  let safety = 0;
  const safetyLimit = width * height * 32;

  while ((worms.length > 0 || floorCount < targetFloor) && safety < safetyLimit) {
    safety += 1;

    if (worms.length === 0) {
      const anchor = pickFrontierCell(floorCells, tiles, width, height, random);
      if (!anchor) {
        break;
      }

      worms.push({
        x: anchor.x,
        y: anchor.y,
        direction: Math.floor(random() * 4) as Direction,
        steps: Math.floor(width * 0.35 + random() * width * 0.4),
        thickness: 1,
        stallCount: 0,
      });
    }

    const worm = worms.pop()!;
    let x = worm.x;
    let y = worm.y;
    let direction = worm.direction;
    let stallCount = worm.stallCount;

    for (let step = 0; step < worm.steps && floorCount < targetFloor; step += 1) {
      const brushRadius = worm.thickness;
      floorCount += carveBrush(tiles, width, height, x, y, brushRadius, floorCells);

      if (step % 18 === 0 && random() < 0.2) {
        worms.push({
          x,
          y,
          direction: turnDirection(direction, random),
          steps: Math.max(12, Math.floor(worm.steps * (0.35 + random() * 0.25))),
          thickness: 1,
          stallCount: 0,
        });
      }

      if (step % 28 === 0 && random() < 0.08 && countFloorNeighbors(tiles, width, height, x, y) <= 1) {
        floorCount += carveBrush(tiles, width, height, x, y, 2, floorCells);
      }

      const next = chooseNextStep(tiles, width, height, x, y, direction, random);
      if (!next) {
        break;
      }

      direction = next.direction;
      const nextX = next.x;
      const nextY = next.y;

      if (tiles[nextY * width + nextX] === 0) {
        stallCount += 1;
        if (stallCount >= 3) {
          break;
        }
      } else {
        stallCount = 0;
      }

      x = nextX;
      y = nextY;
    }
  }

  const entry = findNearestFloor(tiles, width, height, centerX, centerY) ?? {
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

function chooseNextStep(
  tiles: Uint8Array,
  width: number,
  height: number,
  x: number,
  y: number,
  direction: Direction,
  random: () => number,
) {
  const candidates = ([0, 1, 2, 3] as Direction[])
    .map((nextDirection) => {
      const delta = DIRECTIONS[nextDirection];
      const nextX = x + delta.x;
      const nextY = y + delta.y;

      if (nextX < 1 || nextY < 1 || nextX >= width - 1 || nextY >= height - 1) {
        return null;
      }

      const index = nextY * width + nextX;
      const isSolid = tiles[index] === 1;
      const floorNeighbors = countFloorNeighbors(tiles, width, height, nextX, nextY);
      const solidNeighbors = 4 - floorNeighbors;

      let score = 0;

      if (isSolid) {
        score += 26;
      } else {
        score -= 100;
      }

      if (nextDirection === direction) {
        score += 4;
      } else if (nextDirection === oppositeDirection(direction)) {
        score -= 8;
      } else {
        score += 1;
      }

      if (isSolid) {
        if (floorNeighbors === 0) score += 6;
        if (floorNeighbors === 1) score += 2;
        if (floorNeighbors === 2) score -= 10;
        if (floorNeighbors >= 3) score -= 30;
        if (solidNeighbors <= 1) score -= 2;
        if (solidNeighbors >= 3) score += 1;
      } else {
        score -= floorNeighbors * 4;
      }

      score += random() * 0.85;

      return {
        direction: nextDirection,
        x: nextX,
        y: nextY,
        score,
        isSolid,
      };
    })
    .filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== null)
    .sort((a, b) => b.score - a.score);

  if (candidates.length === 0) {
    return null;
  }

  const solidCandidates = candidates.filter((candidate) => candidate.isSolid);
  if (solidCandidates.length > 0) {
    const filtered = solidCandidates.filter((candidate) => countFloorNeighbors(tiles, width, height, candidate.x, candidate.y) <= 1);
    if (filtered.length > 0) {
      return filtered[0];
    }
    return solidCandidates[0];
  }

  return null;
}

function turnDirection(direction: Direction, random: () => number) {
  const roll = random();
  if (roll < 0.33) return turnLeft(direction);
  if (roll < 0.66) return turnRight(direction);
  return oppositeDirection(direction);
}

function turnLeft(direction: Direction) {
  return ((direction + 3) % 4) as Direction;
}

function turnRight(direction: Direction) {
  return ((direction + 1) % 4) as Direction;
}

function oppositeDirection(direction: Direction) {
  return ((direction + 2) % 4) as Direction;
}
