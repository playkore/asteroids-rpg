import { describe, expect, it, vi } from 'vitest';
import { createSeededRandom, generateSeed, normalizeSeed } from '../src/seed';

describe('seed helpers', () => {
  it('generates a seed in the expected format', () => {
    const random = vi
      .fn()
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.7)
      .mockReturnValueOnce(0.25);

    expect(generateSeed(random)).toBe('ALPHA-7G');
  });

  it('normalizes user-entered seed text', () => {
    expect(normalizeSeed('  alpha-7x ')).toBe('ALPHA-7X');
  });

  it('creates deterministic random sequences from the same seed', () => {
    const first = createSeededRandom('ALPHA-7X');
    const second = createSeededRandom('ALPHA-7X');

    expect(first()).toBe(second());
    expect(first()).toBe(second());
  });
});
