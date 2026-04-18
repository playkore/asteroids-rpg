import type { CaveMap } from './grid';
import { neighbors } from './grid';

export function buildDistanceToWallMap(map: CaveMap) {
  const distances = new Int16Array(map.width * map.height);
  distances.fill(-1);
  const queue: Array<{ x: number; y: number }> = [];

  for (let y = 0; y < map.height; y += 1) {
    for (let x = 0; x < map.width; x += 1) {
      const index = y * map.width + x;
      if (map.tiles[index] === 1) {
        distances[index] = 0;
        queue.push({ x, y });
      }
    }
  }

  for (let head = 0; head < queue.length; head += 1) {
    const point = queue[head]!;
    const index = point.y * map.width + point.x;

    for (const neighbor of neighbors(point.x, point.y)) {
      if (neighbor.x < 0 || neighbor.y < 0 || neighbor.x >= map.width || neighbor.y >= map.height) {
        continue;
      }

      const neighborIndex = neighbor.y * map.width + neighbor.x;
      if (distances[neighborIndex] !== -1) {
        continue;
      }

      const currentDistance = distances[index] ?? -1;
      if (currentDistance < 0) {
        continue;
      }

      distances[neighborIndex] = currentDistance + 1;
      queue.push(neighbor);
    }
  }

  return distances;
}

export function countOpenRegionsAboveDistance(map: CaveMap, minimumDistance: number) {
  const distances = buildDistanceToWallMap(map);
  const visited = new Uint8Array(map.width * map.height);
  let regions = 0;

  for (let y = 0; y < map.height; y += 1) {
    for (let x = 0; x < map.width; x += 1) {
      const index = y * map.width + x;
      if (visited[index]) {
        continue;
      }
      if (map.tiles[index] === 1) {
        visited[index] = 1;
        continue;
      }
      const distance = distances[index] ?? -1;
      if (distance < minimumDistance) {
        visited[index] = 1;
        continue;
      }

      regions += 1;
      const queue = [{ x, y }];
      visited[index] = 1;

      for (let head = 0; head < queue.length; head += 1) {
        const point = queue[head]!;
        for (const neighbor of neighbors(point.x, point.y)) {
          if (neighbor.x < 0 || neighbor.y < 0 || neighbor.x >= map.width || neighbor.y >= map.height) {
            continue;
          }
          const neighborIndex = neighbor.y * map.width + neighbor.x;
          if (visited[neighborIndex]) {
            continue;
          }
          const neighborDistance = distances[neighborIndex] ?? -1;
          if (map.tiles[neighborIndex] === 1 || neighborDistance < minimumDistance) {
            visited[neighborIndex] = 1;
            continue;
          }
          visited[neighborIndex] = 1;
          queue.push(neighbor);
        }
      }
    }
  }

  return regions;
}
