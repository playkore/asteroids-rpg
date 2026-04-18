import { deriveSeed, normalizeSeed } from './seed';

export type LevelNodeKind = 'root' | 'main' | 'side' | 'challenge' | 'shortcut';
export type LevelConnectionKind = 'back' | 'main' | 'side' | 'challenge' | 'shortcut';

export type LevelNode = {
  seed: string;
  depth: number;
  kind: LevelNodeKind;
  parentSeed: string | null;
  enteredVia: string | null;
};

export type LevelConnection = {
  key: string;
  kind: LevelConnectionKind;
  targetSeed: string;
  targetDepth: number;
};

export type LevelGraphOptions = {
  maxDepth?: number;
};

const DEFAULT_MAX_DEPTH = 12;

export class LevelGraph {
  readonly maxDepth: number;

  constructor(options: LevelGraphOptions = {}) {
    this.maxDepth = Math.max(0, Math.floor(options.maxDepth ?? DEFAULT_MAX_DEPTH));
  }

  createRoot(seed: string): LevelNode {
    return {
      seed: normalizeSeed(seed),
      depth: 0,
      kind: 'root',
      parentSeed: null,
      enteredVia: null,
    };
  }

  followConnection(node: LevelNode, connection: LevelConnection): LevelNode {
    return {
      seed: connection.targetSeed,
      depth: connection.targetDepth,
      kind: connection.kind === 'back' ? 'main' : connection.kind,
      parentSeed: connection.kind === 'back' ? null : node.seed,
      enteredVia: connection.kind === 'back' ? null : connection.key,
    };
  }

  listConnections(node: LevelNode): LevelConnection[] {
    const connections: LevelConnection[] = [];

    if (node.parentSeed) {
      connections.push({
        key: `back:${node.enteredVia ?? 'parent'}`,
        kind: 'back',
        targetSeed: node.parentSeed,
        targetDepth: Math.max(0, node.depth - 1),
      });
    }

    if (node.depth >= this.maxDepth) {
      return connections;
    }

    const specs = this.getForwardSpecs(node.depth);
    for (const spec of specs) {
      const key = `${spec.kind}:${node.depth}:${spec.slot}`;
      connections.push({
        key,
        kind: spec.kind,
        targetSeed: deriveSeed(node.seed, key),
        targetDepth: Math.min(this.maxDepth, node.depth + spec.depthStep),
      });
    }

    return connections;
  }

  private getForwardSpecs(depth: number) {
    const specs: Array<{
      kind: Exclude<LevelConnectionKind, 'back'>;
      slot: number;
      depthStep: number;
    }> = [{ kind: 'main', slot: 0, depthStep: 1 }];

    if (depth === 0 || depth % 2 === 1) {
      specs.push({ kind: 'side', slot: 0, depthStep: 1 });
    }

    if (depth >= 2 && depth % 3 === 2 && depth % 4 !== 0) {
      specs.push({ kind: 'challenge', slot: 0, depthStep: 2 });
    }

    if (depth >= 4 && depth % 4 === 0) {
      specs.push({ kind: 'shortcut', slot: 0, depthStep: 2 });
    }

    return specs.filter((spec) => depth + spec.depthStep <= this.maxDepth);
  }
}
