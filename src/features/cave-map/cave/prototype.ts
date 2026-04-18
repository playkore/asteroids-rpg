export const PROTOTYPE_CAVE_SIZE = 72;

export function getPrototypeCaveDimensions() {
  return {
    width: PROTOTYPE_CAVE_SIZE,
    height: PROTOTYPE_CAVE_SIZE,
  };
}

export function getSquareMapBounds(viewWidth: number, viewHeight: number) {
  const size = Math.min(viewWidth, viewHeight);
  const offsetX = Math.floor((viewWidth - size) / 2);
  const offsetY = Math.floor((viewHeight - size) / 2);

  return {
    offsetX,
    offsetY,
    size,
  };
}
