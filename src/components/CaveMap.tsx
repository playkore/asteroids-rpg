import { useEffect, useMemo, useRef } from 'react';
import { generateCaveMap, isFloor } from '../cave';

const SEED = 'worm-caves-v1';
const MAP_WIDTH = 84;
const MAP_HEIGHT = 56;

const CAVE_MAP = generateCaveMap(SEED, MAP_WIDTH, MAP_HEIGHT);

export default function CaveMap() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const render = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }

      drawCaveMap(ctx, CAVE_MAP, width, height, dpr);
    };

    render();
    window.addEventListener('resize', render);
    return () => {
      window.removeEventListener('resize', render);
    };
  }, []);

  const stats = useMemo(
    () => `${CAVE_MAP.width} x ${CAVE_MAP.height} • ${Math.round(CAVE_MAP.floorRatio * 100)}% floor`,
    [],
  );

  return (
    <section className="cave-map" aria-label="Seeded worm cave map">
      <canvas ref={canvasRef} className="cave-map__canvas" />
      <div className="cave-map__badge">
        <span>Worm cave prototype</span>
        <strong>{SEED}</strong>
        <em>{stats}</em>
      </div>
    </section>
  );
}

function drawCaveMap(
  ctx: CanvasRenderingContext2D,
  map: typeof CAVE_MAP,
  viewWidth: number,
  viewHeight: number,
  dpr: number,
) {
  const cellSize = Math.max(4, Math.floor(Math.min(viewWidth / map.width, viewHeight / map.height)));
  const mapPixelWidth = map.width * cellSize;
  const mapPixelHeight = map.height * cellSize;
  const offsetX = Math.floor((viewWidth - mapPixelWidth) / 2);
  const offsetY = Math.floor((viewHeight - mapPixelHeight) / 2);
  const edgeLine = Math.max(1.5, Math.min(3, cellSize * 0.16));

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, viewWidth, viewHeight);
  ctx.fillStyle = '#05070c';
  ctx.fillRect(0, 0, viewWidth, viewHeight);

  ctx.fillStyle = '#090d13';
  ctx.fillRect(offsetX - 4, offsetY - 4, mapPixelWidth + 8, mapPixelHeight + 8);

  ctx.fillStyle = '#101720';
  for (let y = 0; y < map.height; y += 1) {
    for (let x = 0; x < map.width; x += 1) {
      if (!isFloor(map, x, y)) {
        continue;
      }
      ctx.fillRect(offsetX + x * cellSize, offsetY + y * cellSize, cellSize, cellSize);
    }
  }

  ctx.strokeStyle = '#dce4ee';
  ctx.lineWidth = edgeLine;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();

  for (let y = 0; y < map.height; y += 1) {
    for (let x = 0; x < map.width; x += 1) {
      if (!isFloor(map, x, y)) {
        continue;
      }

      const px = offsetX + x * cellSize;
      const py = offsetY + y * cellSize;

      if (!isFloor(map, x, y - 1)) {
        ctx.moveTo(px, py);
        ctx.lineTo(px + cellSize, py);
      }
      if (!isFloor(map, x + 1, y)) {
        ctx.moveTo(px + cellSize, py);
        ctx.lineTo(px + cellSize, py + cellSize);
      }
      if (!isFloor(map, x, y + 1)) {
        ctx.moveTo(px + cellSize, py + cellSize);
        ctx.lineTo(px, py + cellSize);
      }
      if (!isFloor(map, x - 1, y)) {
        ctx.moveTo(px, py + cellSize);
        ctx.lineTo(px, py);
      }
    }
  }

  ctx.stroke();

  const entryX = offsetX + map.entry.x * cellSize + cellSize / 2;
  const entryY = offsetY + map.entry.y * cellSize + cellSize / 2;
  const markerSize = Math.max(4, cellSize * 0.35);

  ctx.strokeStyle = '#fff1a8';
  ctx.lineWidth = Math.max(1.5, edgeLine * 0.9);
  ctx.beginPath();
  ctx.moveTo(entryX - markerSize, entryY);
  ctx.lineTo(entryX + markerSize, entryY);
  ctx.moveTo(entryX, entryY - markerSize);
  ctx.lineTo(entryX, entryY + markerSize);
  ctx.stroke();

  ctx.strokeStyle = '#303844';
  ctx.lineWidth = 2;
  ctx.strokeRect(offsetX - 2, offsetY - 2, mapPixelWidth + 4, mapPixelHeight + 4);
}
