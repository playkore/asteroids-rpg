import type { CellState, GameState, Ship } from './game';
import { normalizeCellX } from './game';
import type { PlayerStats } from './rpg';

export type SaveSlotIndex = 0 | 1 | 2;

export type SaveSlotData = {
  version: 1;
  seed: string;
  width: number;
  height: number;
  currentCell: {
    x: number;
    y: number;
  };
  lastClearedCell: {
    x: number;
    y: number;
  };
  ship: Ship;
  player: PlayerStats;
  nextShotAt: number;
  transitionCooldownUntil: number;
  regenAccumulator: number;
  spawnCounter: number;
  gameOver: boolean;
  cells: Record<string, CellState>;
  savedAt: number;
};

export type SaveBundle = {
  version: 1;
  lastSlot: SaveSlotIndex | null;
  slots: Array<SaveSlotData | null>;
};

export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

export const SAVE_BUNDLE_KEY = 'asteroids-rpg:save-bundle';

export function createEmptySaveBundle(): SaveBundle {
  return {
    version: 1,
    lastSlot: null,
    slots: [null, null, null],
  };
}

export function isSaveSlotIndex(value: number): value is SaveSlotIndex {
  return value === 0 || value === 1 || value === 2;
}

export function readSaveBundle(storage: StorageLike): SaveBundle {
  const raw = storage.getItem(SAVE_BUNDLE_KEY);
  if (!raw) {
    return createEmptySaveBundle();
  }

  try {
    const parsed = JSON.parse(raw) as SaveBundle;
    if (
      parsed &&
      parsed.version === 1 &&
      Array.isArray(parsed.slots) &&
      parsed.slots.length === 3
    ) {
      return {
        version: 1,
        lastSlot: isSaveSlotIndex(parsed.lastSlot ?? -1) ? parsed.lastSlot : null,
        slots: [parsed.slots[0] ?? null, parsed.slots[1] ?? null, parsed.slots[2] ?? null],
      };
    }
  } catch {
    // fall through to empty bundle
  }

  return createEmptySaveBundle();
}

export function writeSaveBundle(storage: StorageLike, bundle: SaveBundle) {
  storage.setItem(SAVE_BUNDLE_KEY, JSON.stringify(bundle));
}

export function setSaveSlot(bundle: SaveBundle, slot: SaveSlotIndex, data: SaveSlotData | null): SaveBundle {
  const nextSlots = bundle.slots.slice();
  nextSlots[slot] = data;
  return {
    version: 1,
    lastSlot: data ? slot : bundle.lastSlot,
    slots: nextSlots,
  };
}

export function buildSaveSlotData(state: GameState, slot: SaveSlotIndex): SaveSlotData {
  return {
    version: 1,
    seed: state.seed,
    width: state.width,
    height: state.height,
    currentCell: {
      x: normalizeCellX(state.currentCell.x),
      y: state.currentCell.y,
    },
    lastClearedCell: {
      x: normalizeCellX(state.lastClearedCell.x),
      y: state.lastClearedCell.y,
    },
    ship: { ...state.ship },
    player: { ...state.player },
    nextShotAt: state.nextShotAt,
    transitionCooldownUntil: state.transitionCooldownUntil,
    regenAccumulator: state.regenAccumulator,
    spawnCounter: state.spawnCounter,
    gameOver: state.gameOver,
    cells: cloneCellStateMap(state.cells),
    savedAt: Date.now(),
  };
}

function cloneCellStateMap(cells: Record<string, CellState>) {
  const next: Record<string, CellState> = {};
  for (const [key, cell] of Object.entries(cells)) {
    next[key] = {
      kind: cell.kind,
      visited: cell.visited,
      cleared: cell.cleared,
      remaining: { ...cell.remaining },
    };
  }
  return next;
}
