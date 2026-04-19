import type { MapState } from './game';

type LayoutCell = {
  key: string;
  x: number;
  y: number;
  visited: boolean;
  cleared: boolean;
  remaining: number;
  current: boolean;
};

type GridLayout = {
  cells: LayoutCell[];
  viewBox: string;
  originX: number;
  originY: number;
  cellSize: number;
};

const CELL_SIZE = 30;
const CELL_GAP = 6;
const PADDING = 20;

export default function Map({ mapState }: { mapState: MapState | null }) {
  if (!mapState) {
    return (
      <div className="map" aria-label="Map view">
        <div className="map__status">No map data</div>
      </div>
    );
  }

  const layout = buildGridLayout(mapState);

  return (
    <div className="map" aria-label="Map view">
      <div className="map__header">
        <span className="map__label">Grid Map</span>
        <strong className="map__seed">{mapState.seed}</strong>
        <span className="map__depth">
          Cell {mapState.currentCell.x}, {mapState.currentCell.y}
        </span>
      </div>

      <svg
        className="map__svg"
        viewBox={layout.viewBox}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Grid map"
      >
        {layout.cells.map((cell) => {
          const fill = cell.visited ? '#f5f9ff' : '#05070c';
          const stroke = cell.current ? '#f5f9ff' : '#8f99a6';
          const strokeWidth = cell.current ? 3 : 2;
          return (
            <g
              key={cell.key}
              className={`map__cell${cell.current ? ' is-current' : ''}`}
              data-cell-key={cell.key}
              data-current={cell.current ? 'true' : 'false'}
              data-visited={cell.visited ? 'true' : 'false'}
            >
              <rect
                x={cell.x}
                y={cell.y}
                width={layout.cellSize}
                height={layout.cellSize}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
              />
              {cell.visited && cell.remaining > 0 ? (
                <circle cx={cell.x + layout.cellSize / 2} cy={cell.y + layout.cellSize / 2} r={3} fill="#05070c" />
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function buildGridLayout(mapState: MapState): GridLayout {
  const cells = Object.entries(mapState.cells);
  const xs = cells.map(([key]) => Number(key.split(':')[0]));
  const ys = cells.map(([key]) => Number(key.split(':')[1]));
  xs.push(mapState.currentCell.x);
  ys.push(mapState.currentCell.y);

  const minX = Math.min(...xs, mapState.currentCell.x) - 1;
  const maxX = Math.max(...xs, mapState.currentCell.x) + 1;
  const minY = Math.min(...ys, mapState.currentCell.y) - 1;
  const maxY = Math.max(...ys, mapState.currentCell.y) + 1;

  const gridWidth = maxX - minX + 1;
  const gridHeight = maxY - minY + 1;
  const cellSize = CELL_SIZE + CELL_GAP;
  const cellsLayout: LayoutCell[] = [];

  for (let y = maxY; y >= minY; y -= 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const key = `${x}:${y}`;
      const cell = mapState.cells[key];
      const visited = cell?.visited ?? false;
      const cleared = cell?.cleared ?? false;
      const remaining = cell ? cell.remaining[3] + cell.remaining[2] + cell.remaining[1] : 0;
      cellsLayout.push({
        key,
        x: PADDING + (x - minX) * cellSize,
        y: PADDING + (maxY - y) * cellSize,
        visited,
        cleared,
        remaining,
        current: mapState.currentCell.x === x && mapState.currentCell.y === y,
      });
    }
  }

  const width = PADDING * 2 + gridWidth * cellSize - CELL_GAP;
  const height = PADDING * 2 + gridHeight * cellSize - CELL_GAP;

  return {
    cells: cellsLayout,
    viewBox: `0 0 ${width} ${height}`,
    originX: minX,
    originY: minY,
    cellSize,
  };
}
