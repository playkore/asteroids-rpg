import { describe, expect, it } from 'vitest';
import { estimateFrameRate } from '../src/performance';

describe('estimateFrameRate', () => {
  it('returns zero for non-positive delta', () => {
    expect(estimateFrameRate(0)).toBe(0);
    expect(estimateFrameRate(-1)).toBe(0);
  });

  it('rounds frames per second from delta seconds', () => {
    expect(estimateFrameRate(1 / 60)).toBe(60);
    expect(estimateFrameRate(1 / 30)).toBe(30);
  });
});
