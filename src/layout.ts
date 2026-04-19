export const MENU_BUTTON_TOP = 'calc(max(env(safe-area-inset-top), 14px) + 132px)';
export const GAME_FIELD_TOP = 150;
export const GAME_FIELD_LEFT = 12;

export function getGameCanvasLayout(width: number, height: number) {
  const size = Math.max(0, Math.min(width - GAME_FIELD_LEFT * 2, height - GAME_FIELD_TOP));
  return {
    top: GAME_FIELD_TOP,
    left: GAME_FIELD_LEFT,
    size,
  };
}
