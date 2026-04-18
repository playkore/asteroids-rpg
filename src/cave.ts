import type { Vector } from './game';

type RandomFn = () => number;

type Node = {
  id: number;
  x: number;
  y: number;
  edges: Node[];
};

function distToSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
) {
  const lengthSquared = (bx - ax) ** 2 + (by - ay) ** 2;
  if (lengthSquared === 0) {
    return Math.hypot(px - ax, py - ay);
  }

  let t = ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / lengthSquared;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * (bx - ax)), py - (ay + t * (by - ay)));
}

function addNoise(px: number, py: number, angle: number): Vector {
  const noise =
    Math.sin(px * 0.015) * Math.cos(py * 0.015) * 18 +
    Math.sin(px * 0.041 + py * 0.043) * 9 +
    Math.sin(px * 0.09 - py * 0.08) * 4;

  return {
    x: px + Math.cos(angle) * noise,
    y: py + Math.sin(angle) * noise,
  };
}

function getIntersection(
  p1: Vector,
  a1: number,
  p2: Vector,
  a2: number,
  radius: number,
) {
  const n1 = a1 - Math.PI / 2;
  const n2 = a2 - Math.PI / 2;
  const line1Point = {
    x: p1.x + Math.cos(n1) * radius,
    y: p1.y + Math.sin(n1) * radius,
  };
  const line1Vector = { x: Math.cos(a1), y: Math.sin(a1) };
  const line2Point = {
    x: p2.x + Math.cos(n2) * radius,
    y: p2.y + Math.sin(n2) * radius,
  };
  const line2Vector = { x: Math.cos(a2), y: Math.sin(a2) };

  const dx = line2Point.x - line1Point.x;
  const dy = line2Point.y - line1Point.y;
  const determinant = line1Vector.x * -line2Vector.y - line1Vector.y * -line2Vector.x;
  if (Math.abs(determinant) < 0.001) {
    return line1Point;
  }

  const t1 = (dx * -line2Vector.y - dy * -line2Vector.x) / determinant;
  const maxT = 1000;
  const clampedT1 = Math.max(-maxT, Math.min(maxT, t1));
  return {
    x: line1Point.x + clampedT1 * line1Vector.x,
    y: line1Point.y + clampedT1 * line1Vector.y,
  };
}

export function generateCave(random: RandomFn = Math.random): Vector[] {
  const nodes: Node[] = [{ id: 0, x: 0, y: 0, edges: [] }];
  const pool: Node[] = [nodes[0]!];
  const boundary: Vector[] = [];

  let nextId = 1;
  const MIN_CLEARANCE = 240;
  const TUNNEL_RADIUS = 110;

  let attempts = 0;
  while (nodes.length < 50 && attempts < 2000) {
    attempts += 1;
    if (pool.length === 0) {
      pool.push(nodes[Math.floor(random() * nodes.length)]!);
    }

    const poolIdx = random() < 0.5 ? pool.length - 1 : Math.floor(random() * pool.length);
    const node = pool[poolIdx]!;

    const theta = random() * Math.PI * 2;
    const length = 250 + random() * 200;
    const nx = node.x + Math.cos(theta) * length;
    const ny = node.y + Math.sin(theta) * length;

    let valid = true;
    for (const n1 of nodes) {
      for (const n2 of n1.edges) {
        if (distToSegment(nx, ny, n1.x, n1.y, n2.x, n2.y) < MIN_CLEARANCE) {
          valid = false;
          break;
        }
      }
      if (!valid) {
        break;
      }
    }

    if (valid) {
      for (const n1 of nodes) {
        if (n1 !== node && distToSegment(n1.x, n1.y, node.x, node.y, nx, ny) < MIN_CLEARANCE) {
          valid = false;
          break;
        }
      }
    }

    if (valid) {
      const newNode: Node = { id: nextId++, x: nx, y: ny, edges: [] };
      node.edges.push(newNode);
      newNode.edges.push(node);
      nodes.push(newNode);
      pool.push(newNode);
    } else if (random() < 0.1 && pool.length > 5) {
      pool.splice(poolIdx, 1);
    }
  }

  for (const node of nodes) {
    node.edges.sort(
      (a, b) => Math.atan2(a.y - node.y, a.x - node.x) - Math.atan2(b.y - node.y, b.x - node.x),
    );
  }

  const startNode = nodes[0]!;
  if (startNode.edges.length === 0) {
    for (let i = 0; i < 20; i += 1) {
      const angle = (i / 20) * Math.PI * 2;
      boundary.push({
        x: Math.cos(angle) * TUNNEL_RADIUS,
        y: Math.sin(angle) * TUNNEL_RADIUS,
      });
    }
    return boundary;
  }

  const path: Array<{ A: Node; B: Node }> = [];
  let curr = startNode.edges[0]!;
  let prev = startNode;
  do {
    path.push({ A: prev, B: curr });
    const idx = curr.edges.indexOf(prev);
    const next = curr.edges[(idx + 1) % curr.edges.length]!;
    prev = curr;
    curr = next;
  } while (!(prev === startNode && curr === startNode.edges[0]));

  for (let i = 0; i < path.length; i += 1) {
    const prevS = path[(i - 1 + path.length) % path.length]!;
    const currS = path[i]!;
    const nextS = path[(i + 1) % path.length]!;

    const alphaPrev = Math.atan2(prevS.B.y - prevS.A.y, prevS.B.x - prevS.A.x);
    const alphaCurr = Math.atan2(currS.B.y - currS.A.y, currS.B.x - currS.A.x);
    const alphaNext = Math.atan2(nextS.B.y - nextS.A.y, nextS.B.x - nextS.A.x);

    const nPrev = alphaPrev - Math.PI / 2;
    const nCurr = alphaCurr - Math.PI / 2;
    const nNext = alphaNext - Math.PI / 2;

    let diffA = nCurr - nPrev;
    while (diffA <= -Math.PI) diffA += Math.PI * 2;
    while (diffA > Math.PI) diffA -= Math.PI * 2;

    let diffB = nNext - nCurr;
    while (diffB <= -Math.PI) diffB += Math.PI * 2;
    while (diffB > Math.PI) diffB -= Math.PI * 2;

    let startP: Vector;
    if (diffA > 0) {
      const steps = Math.max(1, Math.ceil(diffA / 0.2));
      for (let j = 0; j <= steps; j += 1) {
        const angle = nPrev + diffA * (j / steps);
        const px = currS.A.x + Math.cos(angle) * TUNNEL_RADIUS;
        const py = currS.A.y + Math.sin(angle) * TUNNEL_RADIUS;
        boundary.push(addNoise(px, py, angle));
      }
      startP = {
        x: currS.A.x + Math.cos(nCurr) * TUNNEL_RADIUS,
        y: currS.A.y + Math.sin(nCurr) * TUNNEL_RADIUS,
      };
    } else {
      startP = getIntersection(prevS.A, alphaPrev, currS.A, alphaCurr, TUNNEL_RADIUS);
    }

    let endP: Vector;
    if (diffB > 0) {
      endP = {
        x: currS.B.x + Math.cos(nCurr) * TUNNEL_RADIUS,
        y: currS.B.y + Math.sin(nCurr) * TUNNEL_RADIUS,
      };
    } else {
      endP = getIntersection(currS.A, alphaCurr, nextS.A, alphaNext, TUNNEL_RADIUS);
    }

    const dx = endP.x - startP.x;
    const dy = endP.y - startP.y;
    const dot = dx * Math.cos(alphaCurr) + dy * Math.sin(alphaCurr);

    if (dot <= 0) {
      const midX = (startP.x + endP.x) / 2;
      const midY = (startP.y + endP.y) / 2;
      startP = { x: midX, y: midY };
      endP = { x: midX, y: midY };
    }

    const segmentLength = Math.hypot(endP.x - startP.x, endP.y - startP.y);
    const segmentSteps = Math.ceil(segmentLength / 25);

    if (diffA <= 0) {
      boundary.push(addNoise(startP.x, startP.y, nCurr));
    }

    for (let j = 1; j < segmentSteps; j += 1) {
      const t = j / segmentSteps;
      const px = startP.x + (endP.x - startP.x) * t;
      const py = startP.y + (endP.y - startP.y) * t;
      boundary.push(addNoise(px, py, nCurr));
    }
  }

  return boundary;
}

export function isPointInsidePolygon(px: number, py: number, polygon: Vector[]) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const current = polygon[i]!;
    const previous = polygon[j]!;
    const intersects =
      current.y > py !== previous.y > py &&
      px < ((previous.x - current.x) * (py - current.y)) / (previous.y - current.y) + current.x;
    if (intersects) {
      inside = !inside;
    }
  }
  return inside;
}
