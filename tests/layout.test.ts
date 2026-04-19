import { describe, expect, it } from 'vitest';
import { GAME_FIELD_LEFT, GAME_FIELD_TOP, getGameCanvasLayout } from '../src/layout';

describe('layout', () => {
  it('creates a square game field below the HUD', () => {
    const layout = getGameCanvasLayout(1280, 900);

    expect(layout.top).toBe(GAME_FIELD_TOP);
    expect(layout.left).toBe(GAME_FIELD_LEFT);
    expect(layout.size).toBe(750);
  });
});
