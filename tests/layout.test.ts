import { describe, expect, it } from 'vitest';
import {
  GAME_FIELD_LEFT,
  GAME_FIELD_TOP,
  getGameCanvasLayout,
  getViewportGameCanvasLayout,
} from '../src/layout';

describe('layout', () => {
  it('creates a square game field below the HUD', () => {
    const layout = getGameCanvasLayout(1280, 900);

    expect(layout.top).toBe(GAME_FIELD_TOP);
    expect(layout.left).toBe(GAME_FIELD_LEFT);
    expect(layout.size).toBe(750);
  });

  it('prefers visual viewport dimensions on mobile browsers', () => {
    const layout = getViewportGameCanvasLayout({
      innerWidth: 430,
      innerHeight: 932,
      visualViewport: {
        width: 390,
        height: 780,
      },
    });

    expect(layout).toEqual({
      top: GAME_FIELD_TOP,
      left: GAME_FIELD_LEFT,
      size: 366,
    });
  });
});
