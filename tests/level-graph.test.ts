import { describe, expect, it } from 'vitest';
import { deriveSeed } from '../src/seed';
import { LevelGraph } from '../src/levelGraph';

describe('LevelGraph', () => {
  it('creates a root level with two forward connections', () => {
    const graph = new LevelGraph();
    const root = graph.createRoot(' alpha-7x ');
    const connections = graph.listConnections(root);

    expect(root).toEqual({
      seed: 'ALPHA-7X',
      depth: 0,
      kind: 'root',
      parentSeed: null,
      enteredVia: null,
    });
    expect(connections.map((connection) => connection.kind)).toEqual(['main', 'side']);
  });

  it('adds a back connection for non-root levels', () => {
    const graph = new LevelGraph();
    const root = graph.createRoot('CINDER-5D');
    const mainConnection = graph.listConnections(root).find((connection) => connection.kind === 'main');

    expect(mainConnection).toBeTruthy();
    if (!mainConnection) {
      return;
    }

    const child = graph.followConnection(root, mainConnection);
    const childConnections = graph.listConnections(child);

    expect(childConnections[0]).toEqual({
      key: `back:${mainConnection.key}`,
      kind: 'back',
      targetSeed: root.seed,
      targetDepth: 0,
    });
  });

  it('keeps the structure deterministic for the same node', () => {
    const graph = new LevelGraph();
    const node = graph.followConnection(graph.createRoot('CINDER-5D'), {
      key: 'main:0:0',
      kind: 'main',
      targetSeed: deriveSeed('CINDER-5D', 'main:0:0'),
      targetDepth: 1,
    });

    expect(graph.listConnections(node)).toEqual(graph.listConnections(node));
  });

  it('limits each node to two forward children and each depth to 12 unique nodes', () => {
    const graph = new LevelGraph();
    const root = graph.createRoot('CINDER-5D');
    const queue = [root];
    const seen = new Set<string>();
    const nodesByDepth = new Map<number, string[]>();
    const incomingCounts = new Map<string, number>();

    while (queue.length > 0) {
      const node = queue.shift()!;
      if (seen.has(node.seed)) {
        continue;
      }

      seen.add(node.seed);
      const depthNodes = nodesByDepth.get(node.depth) ?? [];
      depthNodes.push(node.seed);
      nodesByDepth.set(node.depth, depthNodes);

      const forwardConnections = graph.listConnections(node).filter((connection) => connection.kind !== 'back');
      expect(forwardConnections).toHaveLength(node.depth >= graph.maxDepth ? 0 : 2);

      for (const connection of forwardConnections) {
        const child = graph.followConnection(node, connection);
        incomingCounts.set(child.seed, (incomingCounts.get(child.seed) ?? 0) + 1);
        queue.push(child);
      }
    }

    for (const seeds of nodesByDepth.values()) {
      expect(new Set(seeds).size).toBeLessThanOrEqual(12);
    }

    const mergedNode = Array.from(incomingCounts.values()).some((count) => count > 1);
    expect(mergedNode).toBe(true);
  });

  it('derives child seeds from the current seed and connection key', () => {
    const graph = new LevelGraph();
    const root = graph.createRoot('CINDER-5D');
    const connection = graph.listConnections(root)[0]!;

    expect(connection.targetSeed).toBe(deriveSeed(root.seed, connection.key));
  });

  it('keeps every depth at or below twelve unique nodes', () => {
    const graph = new LevelGraph();
    const root = graph.createRoot('ECHO-9P');
    const queue = [root];
    const seen = new Set<string>();
    const byDepth = new Map<number, Set<string>>();

    while (queue.length > 0) {
      const node = queue.shift()!;
      if (seen.has(node.seed)) {
        continue;
      }

      seen.add(node.seed);
      const depthSeeds = byDepth.get(node.depth) ?? new Set<string>();
      depthSeeds.add(node.seed);
      byDepth.set(node.depth, depthSeeds);

      for (const connection of graph.listConnections(node)) {
        if (connection.kind === 'back') {
          continue;
        }
        queue.push(graph.followConnection(node, connection));
      }
    }

    for (const depthSeeds of byDepth.values()) {
      expect(depthSeeds.size).toBeLessThanOrEqual(12);
    }
  });
});
