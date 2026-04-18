import { DIRECTIONS, countFloorNeighbors, type Direction, type Point } from './grid';

export type WormStep = {
  direction: Direction;
  x: number;
  y: number;
};

export function chooseNextStep(
  tiles: Uint8Array,
  width: number,
  height: number,
  x: number,
  y: number,
  direction: Direction,
  target: Point,
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
      if (tiles[index] === 0) {
        return null;
      }

      const lookahead = measureLookaheadSolid(
        tiles,
        width,
        height,
        nextX,
        nextY,
        nextDirection,
        4,
      );
      const localOpenness = countFloorNeighbors(tiles, width, height, nextX, nextY);
      const targetDistance = distanceSquared(nextX, nextY, target.x, target.y);

      let score = 0;
      score += lookahead * 3;
      score += (4 - localOpenness) * 5;
      score -= targetDistance * 0.004;

      if (nextDirection === direction) {
        score += 4;
      } else if (nextDirection === oppositeDirection(direction)) {
        score -= 7;
      } else {
        score += 1;
      }

      score += random() * 0.5;

      return {
        direction: nextDirection,
        x: nextX,
        y: nextY,
        score,
      };
    })
    .filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== null)
    .sort((a, b) => b.score - a.score);

  return candidates[0] ?? null;
}

export function measureLookaheadSolid(
  tiles: Uint8Array,
  width: number,
  height: number,
  x: number,
  y: number,
  direction: Direction,
  depth: number,
) {
  const forward = DIRECTIONS[direction];
  const side = direction === 0 || direction === 2 ? ({ x: 0, y: 1 } as Point) : ({ x: 1, y: 0 } as Point);
  let solid = 0;
  let samples = 0;

  for (let step = 1; step <= depth; step += 1) {
    const centerX = x + forward.x * step;
    const centerY = y + forward.y * step;

    for (let lateral = -2; lateral <= 2; lateral += 1) {
      for (let forwardOffset = -1; forwardOffset <= 1; forwardOffset += 1) {
        const sampleX = centerX + side.x * lateral + forward.x * forwardOffset;
        const sampleY = centerY + side.y * lateral + forward.y * forwardOffset;

        if (sampleX < 0 || sampleY < 0 || sampleX >= width || sampleY >= height) {
          continue;
        }

        samples += 1;
        if (tiles[sampleY * width + sampleX] === 1) {
          solid += 1;
        }
      }
    }
  }

  return samples === 0 ? 0 : solid / samples;
}

function oppositeDirection(direction: Direction) {
  return ((direction + 2) % 4) as Direction;
}

function distanceSquared(ax: number, ay: number, bx: number, by: number) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}
