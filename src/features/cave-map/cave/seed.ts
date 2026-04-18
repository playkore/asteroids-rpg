export const DEFAULT_CAVE_SEED = 'worm-caves-v1';

export function normalizeCaveSeed(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : DEFAULT_CAVE_SEED;
}
