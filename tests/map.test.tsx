import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import Map, { buildGraphLayout } from '../src/Map';
import { createGameState } from '../src/game';

describe('Map', () => {
  it('lays the graph out with visible branching space', () => {
    const game = createGameState(800, 600, 'CINDER-5D');
    const layout = buildGraphLayout({
      rootSeed: game.rootSeed,
      currentNode: game.currentNode,
      nodeHistory: game.nodeHistory,
      graph: game.graph,
    });

    const xValues = layout.nodes.map((node) => node.x);
    const yValues = layout.nodes.map((node) => node.y);
    const xRange = Math.max(...xValues) - Math.min(...xValues);
    const yRange = Math.max(...yValues) - Math.min(...yValues);

    expect(xRange).toBeGreaterThan(300);
    expect(yRange).toBeGreaterThan(300);
    expect(yRange).toBeGreaterThan(xRange);
    expect(new Set(layout.nodes.map((node) => Math.round(node.y))).size).toBeGreaterThan(3);
    expect(Math.max(...layout.nodes.map((node) => node.depth))).toBe(game.graph.maxDepth);

    const [viewX, viewY, viewWidth, viewHeight] = layout.viewBox.split(' ').map(Number);
    expect(viewX).toBeLessThanOrEqual(-40);
    expect(viewWidth).toBeGreaterThan(xRange);
    expect(viewHeight).toBeGreaterThan(yRange);
  });

  it('keeps nodes on the same depth separated', () => {
    const game = createGameState(800, 600, 'CINDER-5D');
    const layout = buildGraphLayout({
      rootSeed: game.rootSeed,
      currentNode: game.currentNode,
      nodeHistory: game.nodeHistory,
      graph: game.graph,
    });

    const byDepth = new globalThis.Map<number, number[]>();
    for (const node of layout.nodes) {
      const xs = byDepth.get(node.depth) ?? [];
      xs.push(node.x);
      byDepth.set(node.depth, xs);
    }

    for (const xs of byDepth.values()) {
      xs.sort((left, right) => left - right);
      for (let index = 1; index < xs.length; index += 1) {
        expect(xs[index]! - xs[index - 1]!).toBeGreaterThanOrEqual(40);
      }
    }
  });

  it('renders the graph and marks the current level', () => {
    const game = createGameState(800, 600, 'CINDER-5D');
    const mainConnection = game.graph.listConnections(game.currentNode).find((connection) => connection.kind === 'main');

    expect(mainConnection).toBeTruthy();
    if (!mainConnection) {
      return;
    }

    const childNode = game.graph.followConnection(game.currentNode, mainConnection);
    const markup = renderToStaticMarkup(
      <Map
        mapState={{
          rootSeed: game.rootSeed,
          currentNode: childNode,
          nodeHistory: [game.currentNode],
          graph: game.graph,
        }}
      />,
    );

    expect(markup).toContain('Current Level');
    expect(markup).toContain(childNode.seed);
    expect(markup).toContain('data-current="true"');
    expect(markup).toContain('data-edge="main"');
  });
});
