const SEED_WORDS = [
  'ALPHA',
  'BRAVO',
  'CINDER',
  'DELTA',
  'ECHO',
  'FABLE',
  'GAMMA',
  'HARBOR',
];

export function generateSeed(random: () => number = Math.random) {
  const word = SEED_WORDS[Math.floor(random() * SEED_WORDS.length)]!;
  const digit = Math.floor(random() * 10);
  const suffix = String.fromCharCode(65 + Math.floor(random() * 26));
  return `${word}-${digit}${suffix}`;
}

export function createSeededRandom(seed: string) {
  let state = hashSeed(seed) || 1;

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function normalizeSeed(seed: string) {
  return seed.trim().toUpperCase();
}

function hashSeed(seed: string) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
