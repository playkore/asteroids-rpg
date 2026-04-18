import { UI_LINE_COLOR, UI_LINE_WIDTH } from './constants';
import type { MapState } from './game';
import type { LevelConnection, LevelNode } from './levelGraph';

type LayoutNode = LevelNode & {
  x: number;
  y: number;
};

type LayoutEdge = {
  from: string;
  to: string;
  kind: LevelConnection['kind'];
};

type GraphLayout = {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  viewBox: string;
};

const NODE_RADIUS = 6;
const CURRENT_NODE_RADIUS = 12;
const ROOT_NODE_RADIUS = 7;
const DEPTH_SPACING = 196;
const LANE_SPACING = 92;
const SVG_MARGIN = 44;
const FORWARD_CONNECTION_ORDER: Array<LevelConnection['kind']> = ['main', 'side', 'challenge', 'shortcut'];

export default function Map({ mapState }: { mapState: MapState | null }) {
  if (!mapState) {
    return (
      <div className="map" aria-label="Map view">
        <div className="map__status">No map data</div>
      </div>
    );
  }

  const layout = buildGraphLayout(mapState);
  const currentSeed = mapState.currentNode.seed;
  const currentDepth = mapState.currentNode.depth;

  return (
    <div className="map" aria-label="Map view">
      <div className="map__header">
        <span className="map__label">Current Level</span>
        <strong className="map__seed">{currentSeed}</strong>
        <span className="map__depth">Depth {currentDepth}</span>
      </div>

      <svg
        className="map__svg"
        viewBox={layout.viewBox}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Level graph"
      >
        {layout.edges.map((edge) => {
          const from = layout.nodes.find((node) => node.seed === edge.from);
          const to = layout.nodes.find((node) => node.seed === edge.to);
          if (!from || !to) {
            return null;
          }

          return (
            <line
              key={`${edge.from}->${edge.to}`}
              className={`map__edge map__edge--${edge.kind}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              data-edge={edge.kind}
            />
          );
        })}

        {layout.nodes.map((node) => {
          const isCurrent = node.seed === currentSeed;
          const isRoot = node.depth === 0;
          const isPath = mapState.nodeHistory.some((historyNode) => historyNode.seed === node.seed);
          const radius = isCurrent ? CURRENT_NODE_RADIUS : isRoot ? ROOT_NODE_RADIUS : NODE_RADIUS;

          return (
            <g
              key={node.seed}
              className={[
                'map__node',
                isCurrent ? 'is-current' : '',
                isPath ? 'is-path' : '',
                isRoot ? 'is-root' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              data-node-kind={node.kind}
              data-current={isCurrent ? 'true' : 'false'}
            >
              <circle cx={node.x} cy={node.y} r={radius} />
              {isCurrent ? <circle cx={node.x} cy={node.y} r={radius + 8} className="map__node-ring" /> : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function buildGraphLayout(mapState: MapState): GraphLayout {
  const root = mapState.graph.createRoot(mapState.rootSeed);
  const visited = new Set<string>();
  const nodes: LayoutNode[] = [];
  const nodeBySeed = new globalThis.Map<string, LayoutNode>();
  const edges: LayoutEdge[] = [];
  const childMap = new globalThis.Map<string, LevelNode[]>();

  const visit = (node: LevelNode) => {
    if (visited.has(node.seed)) {
      return;
    }

    visited.add(node.seed);
    const layoutNode: LayoutNode = {
      ...node,
      x: 0,
      y: 0,
    };
    nodes.push(layoutNode);
    nodeBySeed.set(node.seed, layoutNode);

    if (node.depth >= mapState.graph.maxDepth) {
      childMap.set(node.seed, []);
      return;
    }

    const forwardConnections = mapState.graph
      .listConnections(node)
      .filter((connection) => connection.kind !== 'back')
      .sort((left, right) => FORWARD_CONNECTION_ORDER.indexOf(left.kind) - FORWARD_CONNECTION_ORDER.indexOf(right.kind));
    const children: LevelNode[] = [];
    for (const connection of forwardConnections) {
      const child = mapState.graph.followConnection(node, connection);
      visit(child);
      if (!visited.has(child.seed)) {
        continue;
      }

      children.push(child);
      edges.push({
        from: node.seed,
        to: child.seed,
        kind: connection.kind,
      });
    }
    childMap.set(node.seed, children);
  };

  visit(root);

  const laneCursor = { value: 0 };
  const positioned = new Set<string>();
  const positionNode = (node: LayoutNode): number => {
    if (positioned.has(node.seed)) {
      return node.y;
    }

    positioned.add(node.seed);
    const children = childMap.get(node.seed) ?? [];
    if (children.length === 0) {
      node.x = (node.depth - mapState.currentNode.depth) * DEPTH_SPACING;
      node.y = laneCursor.value * LANE_SPACING;
      laneCursor.value += 1;
      return node.y;
    }

    const childYs = children.map((child: LevelNode) => {
      const layoutChild = nodeBySeed.get(child.seed);
      return layoutChild ? positionNode(layoutChild) : 0;
    });

    node.x = (node.depth - mapState.currentNode.depth) * DEPTH_SPACING;
    node.y = childYs.reduce((sum: number, value: number) => sum + value, 0) / childYs.length;
    return node.y;
  };

  positionNode(nodeBySeed.get(root.seed)!);

  const bounds = getBounds(nodes);
  const minX = bounds.minX - SVG_MARGIN;
  const minY = bounds.minY - SVG_MARGIN;
  const width = bounds.maxX - bounds.minX + SVG_MARGIN * 2;
  const height = bounds.maxY - bounds.minY + SVG_MARGIN * 2;

  const maxDepthSeeds = nodes.filter((node) => node.depth === mapState.graph.maxDepth).map((node) => node.seed);
  console.log('[map] max depth seeds', maxDepthSeeds);

  return {
    nodes,
    edges,
    viewBox: `${minX} ${minY} ${width} ${height}`,
  };
}

function getBounds(nodes: LayoutNode[]) {
  if (nodes.length === 0) {
    return {
      minX: -100,
      maxX: 100,
      minY: -100,
      maxY: 100,
      width: 200,
      height: 200,
    };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x);
    maxY = Math.max(maxY, node.y);
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
  };
}
