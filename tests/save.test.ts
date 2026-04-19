import { describe, expect, it } from 'vitest';
import { createGameState } from '../src/game';
import {
  buildSaveSlotData,
  createEmptySaveBundle,
  readSaveBundle,
  setSaveSlot,
  writeSaveBundle,
} from '../src/save';

function createStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  };
}

describe('save bundle', () => {
  it('stores three slots and tracks the last used slot', () => {
    const storage = createStorage();
    const bundle = setSaveSlot(createEmptySaveBundle(), 1, {
      version: 1,
      seed: 'CINDER-5D',
      width: 320,
      height: 240,
      currentCell: { x: 2, y: 3 },
      ship: {
        x: 160,
        y: 120,
        vx: 0,
        vy: 0,
        angle: 0,
        invulnerableUntil: 0,
        alive: true,
        recoilUntil: 0,
      },
      player: {
        level: 1,
        xp: 0,
        hp: 10,
        maxHp: 10,
        attack: 2,
      },
      nextShotAt: 0,
      transitionCooldownUntil: 0,
      regenAccumulator: 0,
      spawnCounter: 0,
      gameOver: false,
      lastClearedCell: { x: 2, y: 3 },
      cells: {
        '2:3': {
          kind: 'empty',
          visited: true,
          cleared: false,
          remaining: { 3: 0, 2: 0, 1: 0 },
        },
      },
      savedAt: 123,
    });

    writeSaveBundle(storage, bundle);
    const stored = readSaveBundle(storage);

    expect(stored.lastSlot).toBe(1);
    expect(stored.slots).toHaveLength(3);
    expect(stored.slots[1]?.seed).toBe('CINDER-5D');
    expect(stored.slots[0]).toBeNull();
    expect(stored.slots[2]).toBeNull();
  });

  it('zeros transient ship feedback when building save data', () => {
    const state = createGameState(320, 240, 'CINDER-5D');
    state.ship.recoilUntil = 999;

    const slot = buildSaveSlotData(state, 1);

    expect(slot.ship.recoilUntil).toBe(0);
  });

  it('falls back to an empty bundle for invalid storage', () => {
    const storage = createStorage();
    storage.setItem('asteroids-rpg:save-bundle', '{broken json');

    expect(readSaveBundle(storage)).toEqual(createEmptySaveBundle());
  });
});
