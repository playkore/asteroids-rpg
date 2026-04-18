import { describe, expect, it } from 'vitest';
import { generateCaveMap, isFloor } from './cave';
import { countOpenRegionsAboveDistance } from './cave/analysis';
import { createSeededRandom } from './cave/random';
import { DEFAULT_CAVE_SEED, normalizeCaveSeed } from './cave/seed';

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
    const first = createSeededRandom(DEFAULT_CAVE_SEED);
    const second = createSeededRandom(DEFAULT_CAVE_SEED);
    const third = createSeededRandom('worm-caves-v2');

    const firstSequence = [first(), first(), first(), first()];
    const secondSequence = [second(), second(), second(), second()];
    const thirdSequence = [third(), third(), third(), third()];

    expect(firstSequence).toEqual(secondSequence);
    expect(firstSequence).not.toEqual(thirdSequence);
  });

  it('is deterministic for the same seed', () => {
    const first = generateCaveMap(DEFAULT_CAVE_SEED, WIDTH, HEIGHT);
    const second = generateCaveMap(DEFAULT_CAVE_SEED, WIDTH, HEIGHT);

    expect(tileSignature(first)).toBe(tileSignature(second));
    expect(first.floorCount).toBe(second.floorCount);
    expect(first.entry).toEqual(second.entry);
  });

  it('changes when the seed changes', () => {
    const first = generateCaveMap(DEFAULT_CAVE_SEED, WIDTH, HEIGHT);
    const second = generateCaveMap('worm-caves-v2', WIDTH, HEIGHT);

    expect(tileSignature(first)).not.toBe(tileSignature(second));
  });

  it('keeps the cave connected from the entry point', () => {
    const map = generateCaveMap(DEFAULT_CAVE_SEED, WIDTH, HEIGHT);

    expect(isFloor(map, map.entry.x, map.entry.y)).toBe(true);
    expect(countReachableFloors(map)).toBe(map.floorCount);
  });

  it('stays within a sane floor coverage range', () => {
    const map = generateCaveMap(DEFAULT_CAVE_SEED, WIDTH, HEIGHT);

    expect(map.floorRatio).toBeGreaterThan(0.08);
    expect(map.floorRatio).toBeLessThan(0.3);
  });

  it('produces multiple cave bodies instead of one large room', () => {
    const map = generateCaveMap(DEFAULT_CAVE_SEED, WIDTH, HEIGHT);
    const regions = countOpenRegionsAboveDistance(map, 3);

    expect(regions).toBeGreaterThanOrEqual(3);
  });

  it('normalizes blank seed input to the default seed', () => {
    expect(normalizeCaveSeed('')).toBe(DEFAULT_CAVE_SEED);
    expect(normalizeCaveSeed('   ')).toBe(DEFAULT_CAVE_SEED);
    expect(normalizeCaveSeed('  cave-42  ')).toBe('cave-42');
  });
});
