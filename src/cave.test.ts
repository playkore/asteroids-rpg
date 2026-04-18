import { describe, expect, it } from 'vitest';
import { generateCaveMap, isFloor } from './cave';
import { createSeededRandom } from './cave/random';

const WIDTH = 84;
const HEIGHT = 56;

function tileSignature(map: ReturnType<typeof generateCaveMap>) {
  return Array.from(map.tiles).join('');
}

function countReachableFloors(map: ReturnType<typeof generateCaveMap>) {
  const visited = new Uint8Array(map.width * map.height);
  const queue = [{ x: map.entry.x, y: map.entry.y }];
  let head = 0;
  let count = 0;

  visited[map.entry.y * map.width + map.entry.x] = 1;

  while (head < queue.length) {
    const point = queue[head]!;
    head += 1;

    if (!isFloor(map, point.x, point.y)) {
      continue;
    }

    count += 1;

    const neighbors = [
      { x: point.x + 1, y: point.y },
      { x: point.x - 1, y: point.y },
      { x: point.x, y: point.y + 1 },
      { x: point.x, y: point.y - 1 },
    ];

    for (const neighbor of neighbors) {
      if (neighbor.x < 0 || neighbor.y < 0 || neighbor.x >= map.width || neighbor.y >= map.height) {
        continue;
      }

      const index = neighbor.y * map.width + neighbor.x;
      if (visited[index]) {
        continue;
      }

      visited[index] = 1;
      queue.push(neighbor);
    }
  }

  return count;
}

describe('generateCaveMap', () => {
  it('creates a deterministic seeded random sequence', () => {
    const first = createSeededRandom('worm-caves-v1');
    const second = createSeededRandom('worm-caves-v1');
    const third = createSeededRandom('worm-caves-v2');

    const firstSequence = [first(), first(), first(), first()];
    const secondSequence = [second(), second(), second(), second()];
    const thirdSequence = [third(), third(), third(), third()];

    expect(firstSequence).toEqual(secondSequence);
    expect(firstSequence).not.toEqual(thirdSequence);
  });

  it('is deterministic for the same seed', () => {
    const first = generateCaveMap('worm-caves-v1', WIDTH, HEIGHT);
    const second = generateCaveMap('worm-caves-v1', WIDTH, HEIGHT);

    expect(tileSignature(first)).toBe(tileSignature(second));
    expect(first.floorCount).toBe(second.floorCount);
    expect(first.entry).toEqual(second.entry);
  });

  it('changes when the seed changes', () => {
    const first = generateCaveMap('worm-caves-v1', WIDTH, HEIGHT);
    const second = generateCaveMap('worm-caves-v2', WIDTH, HEIGHT);

    expect(tileSignature(first)).not.toBe(tileSignature(second));
  });

  it('keeps the cave connected from the entry point', () => {
    const map = generateCaveMap('worm-caves-v1', WIDTH, HEIGHT);

    expect(isFloor(map, map.entry.x, map.entry.y)).toBe(true);
    expect(countReachableFloors(map)).toBe(map.floorCount);
  });

  it('stays within a sane floor coverage range', () => {
    const map = generateCaveMap('worm-caves-v1', WIDTH, HEIGHT);

    expect(map.floorRatio).toBeGreaterThan(0.1);
    expect(map.floorRatio).toBeLessThan(0.3);
  });
});
