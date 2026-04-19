export const GAME_FIELD_TOP = 0;
export const GAME_FIELD_LEFT = 0;

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
  return {
    top: GAME_FIELD_TOP,
    left: GAME_FIELD_LEFT,
    width: Math.max(0, Math.floor(width)),
    height: Math.max(0, Math.floor(height)),
  };
}

export function getViewportGameCanvasLayout(viewport: ViewportLike) {
  const { width, height } = getViewportSize(viewport);
  return getGameCanvasLayout(width, height);
}
