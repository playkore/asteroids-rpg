import type { Vector } from './game';

export function generateCave(baseRadius: number, numPoints: number): Vector[] {
  const cave: Vector[] = [];
  for (let i = 0; i < numPoints; i += 1) {
    const angle = (i / numPoints) * Math.PI * 2;
    const radius =
      baseRadius +
      Math.sin(angle * 6) * (baseRadius * 0.15) +
      Math.sin(angle * 14 + 2) * (baseRadius * 0.08) +
      Math.sin(angle * 29 + 1) * (baseRadius * 0.04);
    cave.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    });
  }
  return cave;
}
