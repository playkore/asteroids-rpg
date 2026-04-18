import { describe, expect, it } from 'vitest';
import { UI_LINE_COLOR, UI_LINE_WIDTH, UI_LINE_WIDTH_PX } from '../src/constants';

describe('UI line width', () => {
  it('uses a shared 2.5px stroke width', () => {
    expect(UI_LINE_WIDTH).toBe(2.5);
    expect(UI_LINE_WIDTH_PX).toBe('2.5px');
    expect(UI_LINE_COLOR).toBe('#f4fbff');
  });
});
