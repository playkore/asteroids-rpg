export const GAME_FIELD_TOP = 150;
export const GAME_FIELD_LEFT = 12;

type ViewportLike = {
  innerWidth: number;
  innerHeight: number;
  visualViewport?: {
    width: number;
    height: number;
  } | null;
};

export function getViewportSize(viewport: ViewportLike) {
  const width = viewport.visualViewport?.width ?? viewport.innerWidth;
  const height = viewport.visualViewport?.height ?? viewport.innerHeight;

  return {
    width: Math.max(0, Math.floor(width)),
    height: Math.max(0, Math.floor(height)),
  };
}

export function getGameCanvasLayout(width: number, height: number) {
  const size = Math.max(0, Math.min(width - GAME_FIELD_LEFT * 2, height - GAME_FIELD_TOP));
  return {
    top: GAME_FIELD_TOP,
    left: GAME_FIELD_LEFT,
    size,
  };
}

export function getViewportGameCanvasLayout(viewport: ViewportLike) {
  const { width, height } = getViewportSize(viewport);
  return getGameCanvasLayout(width, height);
}
