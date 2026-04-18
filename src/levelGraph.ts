import { createSeededRandom, deriveSeed, normalizeSeed } from './seed';

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
const MAX_NODES_PER_DEPTH = 12;
const FORWARD_SLOTS: Array<{
  kind: Exclude<LevelConnectionKind, 'back'>;
  slot: number;
}> = [
  { kind: 'main', slot: 0 },
  { kind: 'side', slot: 1 },
];

export class LevelGraph {
  readonly maxDepth: number;
  private rootSeed: string | null = null;
  private nodesBySeed = new Map<string, LevelNode>();
  private connectionsBySeed = new Map<string, LevelConnection[]>();
  private layersByDepth = new Map<number, LevelNode[]>();
  private layerSeedsByDepth = new Map<number, Set<string>>();

  constructor(options: LevelGraphOptions = {}) {
    this.maxDepth = Math.max(0, Math.floor(options.maxDepth ?? DEFAULT_MAX_DEPTH));
  }

  createRoot(seed: string): LevelNode {
    const rootSeed = normalizeSeed(seed);
    const root: LevelNode = {
      seed: rootSeed,
      depth: 0,
      kind: 'root',
      parentSeed: null,
      enteredVia: null,
    };

    this.rootSeed = rootSeed;
    this.nodesBySeed = new Map([[root.seed, root]]);
    this.connectionsBySeed = new Map([[root.seed, []]]);
    this.layersByDepth = new Map([[0, [root]]]);
    this.layerSeedsByDepth = new Map([[0, new Set([root.seed])]]);
    this.buildGraph();
    return root;
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
    const connections = [...(this.connectionsBySeed.get(node.seed) ?? [])];
    if (node.parentSeed) {
      connections.unshift({
        key: `back:${node.enteredVia ?? 'parent'}`,
        kind: 'back',
        targetSeed: node.parentSeed,
        targetDepth: Math.max(0, node.depth - 1),
      });
    }
    return connections;
  }

  private buildGraph() {
    if (!this.rootSeed) {
      return;
    }

    for (let depth = 0; depth < this.maxDepth; depth += 1) {
      const parents = this.layersByDepth.get(depth) ?? [];
      if (parents.length === 0) {
        break;
      }

      const nextDepth = depth + 1;
      const nextLayer = this.layersByDepth.get(nextDepth) ?? [];
      const nextLayerSeeds = this.layerSeedsByDepth.get(nextDepth) ?? new Set<string>();
      if (!this.layersByDepth.has(nextDepth)) {
        this.layersByDepth.set(nextDepth, nextLayer);
        this.layerSeedsByDepth.set(nextDepth, nextLayerSeeds);
      }

      for (const parent of parents) {
        const connections: LevelConnection[] = [];
        const chosenChildSeeds = new Set<string>();
        for (const spec of FORWARD_SLOTS) {
          const key = `${spec.kind}:${parent.depth}:${spec.slot}`;
          const child = this.selectChildNode(
            parent,
            key,
            spec.kind,
            nextDepth,
            nextLayer,
            nextLayerSeeds,
            chosenChildSeeds,
          );
          chosenChildSeeds.add(child.seed);
          connections.push({
            key,
            kind: spec.kind,
            targetSeed: child.seed,
            targetDepth: nextDepth,
          });
        }
        this.connectionsBySeed.set(parent.seed, connections);
      }
    }
  }

  private selectChildNode(
    parent: LevelNode,
    key: string,
    kind: Exclude<LevelConnectionKind, 'back'>,
    targetDepth: number,
    nextLayer: LevelNode[],
    nextLayerSeeds: Set<string>,
    excludedSeeds: Set<string>,
  ) {
    const candidateSeed = deriveSeed(parent.seed, key);
    const exactMatch = this.nodesBySeed.get(candidateSeed);
    if (exactMatch && exactMatch.depth === targetDepth && !excludedSeeds.has(exactMatch.seed)) {
      return exactMatch;
    }

    let seed = candidateSeed;
    if (this.nodesBySeed.has(seed) || nextLayerSeeds.has(seed) || excludedSeeds.has(seed)) {
      seed = this.createUniqueSeed(parent.seed, key, nextLayerSeeds, excludedSeeds);
    }

    if (nextLayer.length < MAX_NODES_PER_DEPTH) {
      return this.createNode(seed, targetDepth, parent.seed, key, kind, nextLayer, nextLayerSeeds);
    }

    return this.pickExistingNode(parent.seed, key, nextLayer, excludedSeeds);
  }

  private createNode(
    seed: string,
    depth: number,
    parentSeed: string,
    enteredVia: string,
    kind: Exclude<LevelConnectionKind, 'back'>,
    nextLayer: LevelNode[],
    nextLayerSeeds: Set<string>,
  ) {
    const node: LevelNode = {
      seed,
      depth,
      kind,
      parentSeed,
      enteredVia,
    };
    this.nodesBySeed.set(seed, node);
    this.connectionsBySeed.set(seed, []);
    nextLayer.push(node);
    nextLayerSeeds.add(seed);
    return node;
  }

  private pickExistingNode(parentSeed: string, key: string, nextLayer: LevelNode[], excludedSeeds: Set<string>) {
    if (nextLayer.length === 0) {
      const seed = this.createUniqueSeed(parentSeed, key, new Set<string>(), excludedSeeds);
      const node: LevelNode = {
        seed,
        depth: 0,
        kind: 'main',
        parentSeed,
        enteredVia: key,
      };
      this.nodesBySeed.set(seed, node);
      this.connectionsBySeed.set(seed, []);
      nextLayer.push(node);
      return node;
    }

    const rng = createSeededRandom(deriveSeed(parentSeed, `${key}:reuse`));
    const startIndex = Math.floor(rng() * nextLayer.length) % nextLayer.length;
    for (let offset = 0; offset < nextLayer.length; offset += 1) {
      const candidate = nextLayer[(startIndex + offset) % nextLayer.length]!;
      if (!excludedSeeds.has(candidate.seed)) {
        return candidate;
      }
    }

    return nextLayer[startIndex]!;
  }

  private createUniqueSeed(parentSeed: string, key: string, reservedSeeds: Set<string>, excludedSeeds: Set<string>) {
    let attempt = 0;
    let seed = deriveSeed(parentSeed, `${key}:node:${attempt}`);

    while (this.nodesBySeed.has(seed) || reservedSeeds.has(seed) || excludedSeeds.has(seed)) {
      attempt += 1;
      seed = deriveSeed(parentSeed, `${key}:node:${attempt}`);
    }

    return seed;
  }
}
