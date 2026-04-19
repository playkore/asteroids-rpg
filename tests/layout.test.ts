import { describe, expect, it } from 'vitest';
import {
  GAME_FIELD_LEFT,
  GAME_FIELD_TOP,
  getGameCanvasLayout,
  getViewportSize,
  getViewportGameCanvasLayout,
} from '../src/layout';

describe('layout', () => {
  it('creates a full-screen game field', () => {
    const layout = getGameCanvasLayout(1280, 900);

    expect(layout).toEqual({
      top: GAME_FIELD_TOP,
      left: GAME_FIELD_LEFT,
      width: 1280,
      height: 900,
    });
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
      width: 390,
      height: 780,
    });
  });

  it('falls back to inner dimensions when visual viewport is unavailable', () => {
    expect(
      getViewportSize({
        innerWidth: 430.8,
        innerHeight: 932.4,
        visualViewport: null,
      }),
    ).toEqual({
      width: 430,
      height: 932,
    });
  });
});
