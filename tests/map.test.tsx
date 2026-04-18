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
    expect(new Set(layout.nodes.map((node) => Math.round(node.y))).size).toBeGreaterThan(3);
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
