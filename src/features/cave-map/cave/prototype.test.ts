import { describe, expect, it } from 'vitest';
import { getPrototypeCaveDimensions, getSquareMapBounds, PROTOTYPE_CAVE_SIZE } from './prototype';

describe('prototype cave layout', () => {
  it('uses a square cave size', () => {
    const dimensions = getPrototypeCaveDimensions();

    expect(PROTOTYPE_CAVE_SIZE).toBeGreaterThan(0);
    expect(dimensions.width).toBe(dimensions.height);
  });

  it('centers a square map inside the viewport bounds', () => {
    expect(getSquareMapBounds(800, 600)).toEqual({
      offsetX: 100,
      offsetY: 0,
      size: 600,
    });
    expect(getSquareMapBounds(600, 800)).toEqual({
      offsetX: 0,
      offsetY: 100,
      size: 600,
    });
  });
});
