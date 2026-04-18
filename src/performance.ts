export function estimateFrameRate(deltaSeconds: number) {
  if (deltaSeconds <= 0) {
    return 0;
  }

  return Math.round(1 / deltaSeconds);
}
