import { describe, expect, it } from 'vitest';
import { deriveSeed } from '../src/seed';
import { LevelGraph } from '../src/levelGraph';

describe('LevelGraph', () => {
  it('creates a root level with only forward connections', () => {
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
    const mainConnection = graph
      .listConnections(root)
      .find((connection) => connection.kind === 'main');

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

  it('introduces challenge and shortcut links at deeper levels', () => {
    const graph = new LevelGraph();
    const node = {
      seed: 'DELTA-2Q',
      depth: 8,
      kind: 'main' as const,
      parentSeed: 'CINDER-5D',
      enteredVia: 'main:7:0',
    };

    const kinds = graph.listConnections(node).map((connection) => connection.kind);

    expect(kinds).toEqual(['back', 'main', 'shortcut']);
  });

  it('adds a challenge link on every third depth pattern', () => {
    const graph = new LevelGraph();
    const node = {
      seed: 'DELTA-2Q',
      depth: 5,
      kind: 'main' as const,
      parentSeed: 'CINDER-5D',
      enteredVia: 'main:4:0',
    };

    const kinds = graph.listConnections(node).map((connection) => connection.kind);

    expect(kinds).toEqual(['back', 'main', 'side', 'challenge']);
  });

  it('caps forward progression at the configured max depth', () => {
    const graph = new LevelGraph({ maxDepth: 3 });
    const node = {
      seed: 'BRAVO-1A',
      depth: 3,
      kind: 'main' as const,
      parentSeed: 'ALPHA-7X',
      enteredVia: 'main:2:0',
    };

    expect(graph.listConnections(node)).toEqual([
      {
        key: 'back:main:2:0',
        kind: 'back',
        targetSeed: 'ALPHA-7X',
        targetDepth: 2,
      },
    ]);
  });

  it('derives child seeds from the current seed and connection key', () => {
    const graph = new LevelGraph();
    const root = graph.createRoot('CINDER-5D');
    const connection = graph.listConnections(root)[0]!;

    expect(connection.targetSeed).toBe(deriveSeed(root.seed, connection.key));
  });
});
