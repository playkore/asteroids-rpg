import { describe, expect, it } from 'vitest';
import { formatHudCellCoord, formatHudX, formatHudY } from '../src/coordLabels';

describe('coord labels', () => {
  it('formats x coordinates as named sectors', () => {
    expect(formatHudX(0)).toBe('ALFA');
    expect(formatHudX(4)).toBe('ECHO');
    expect(formatHudX(7)).toBe('ALFA');
  });

  it('formats y coordinates in letter-digit groups', () => {
    expect(formatHudY(0)).toBe('A0');
    expect(formatHudY(13)).toBe('B3');
    expect(formatHudY(253)).toBe('Z3');
    expect(formatHudY(260)).toBe('AA0');
  });

  it('formats a full HUD coordinate label', () => {
    expect(formatHudCellCoord(4, 253)).toBe('ECHO-Z3');
  });
});
