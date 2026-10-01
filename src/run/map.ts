import type { Rng } from '../engine/random';

export type NodeType = 'battle' | 'epic' | 'event' | 'store' | 'treasure' | 'boss';

export interface MapNode {
  id: string;
  floor: number;
  column: number;
  type: NodeType;
  // Ids of connected nodes on the next floor (the boss for the last floor).
  next: string[];
}

export interface RunMap {
  floors: MapNode[][];
  boss: MapNode;
}

export const FLOORS = 15;
export const COLUMNS = 7;
export const PATHS = 6;
// Room 7 on every path is a Treasure; it is the only place treasure appears.
export const TREASURE_FLOOR = 6;
// Epic Monsters never appear this early, so a run opens on ordinary fights.
export const FIRST_EPIC_FLOOR = 4;

const TYPE_WEIGHTS: [NodeType, number][] = [
  ['battle', 50],
  ['epic', 15],
  ['event', 25],
  ['store', 10],
];

export function nodeId(floor: number, column: number): string {
  return `${floor}-${column}`;
}

// Slay the Spire–style: PATHS walks climb the grid one floor at a time, stepping to an adjacent column
// without crossing an existing edge. Walks may share nodes, so paths merge and split.
export function generateMap(rng: Rng): RunMap {
  const edges = new Set<string>();
  const cells = new Map<string, { floor: number; column: number; next: Set<string> }>();
  const cell = (floor: number, column: number) => {
    const id = nodeId(floor, column);
    if (!cells.has(id)) cells.set(id, { floor, column, next: new Set() });
    return cells.get(id)!;
  };

  const starts: number[] = [];
  for (let p = 0; p < PATHS; p++) {
    let column = Math.floor(rng() * COLUMNS);
    // The first two walks start apart so floor 1 always offers a real choice.
    if (p === 1) while (column === starts[0]) column = Math.floor(rng() * COLUMNS);
    starts.push(column);

    for (let floor = 0; floor < FLOORS - 1; floor++) {
      const options = [column - 1, column, column + 1].filter(
        (c) => c >= 0 && c < COLUMNS && (c === column || !edges.has(`${floor}:${c}>${column}`)),
      );
      const nextColumn = options[Math.floor(rng() * options.length)];
      edges.add(`${floor}:${column}>${nextColumn}`);
      cell(floor, column).next.add(nodeId(floor + 1, nextColumn));
      column = nextColumn;
    }
    cell(FLOORS - 1, column);
  }

  const boss: MapNode = { id: 'boss', floor: FLOORS, column: Math.floor(COLUMNS / 2), type: 'boss', next: [] };
  const floors: MapNode[][] = Array.from({ length: FLOORS }, () => []);
  for (const [id, c] of cells) {
    const next = c.floor === FLOORS - 1 ? [boss.id] : [...c.next].sort();
    floors[c.floor].push({ id, floor: c.floor, column: c.column, type: 'battle', next });
  }
  for (const floor of floors) floor.sort((a, b) => a.column - b.column);
  assignTypes(floors, rng);
  return { floors, boss };
}

function assignTypes(floors: MapNode[][], rng: Rng): void {
  const parents = new Map<string, MapNode[]>();
  for (const node of floors.flat()) {
    for (const id of node.next) parents.set(id, [...(parents.get(id) ?? []), node]);
  }
  for (const floor of floors) {
    for (const node of floor) {
      if (node.floor === 0) node.type = 'battle';
      else if (node.floor === TREASURE_FLOOR) node.type = 'treasure';
      else node.type = rollType(node, parents.get(node.id) ?? [], rng);
    }
  }
}

// Keeps variety along a path: no Epic before FIRST_EPIC_FLOOR, and no Epic/Store/Event straight after the same type.
function rollType(node: MapNode, parents: MapNode[], rng: Rng): NodeType {
  const allowed = TYPE_WEIGHTS.filter(([type]) => {
    if (type === 'epic' && node.floor < FIRST_EPIC_FLOOR) return false;
    if (type !== 'battle' && parents.some((p) => p.type === type)) return false;
    return true;
  });
  const total = allowed.reduce((sum, [, w]) => sum + w, 0);
  let roll = rng() * total;
  for (const [type, weight] of allowed) {
    roll -= weight;
    if (roll < 0) return type;
  }
  return 'battle';
}

export function findNode(map: RunMap, id: string): MapNode | undefined {
  if (id === map.boss.id) return map.boss;
  return map.floors.flat().find((n) => n.id === id);
}

// Nodes the player may enter next: any floor-1 node at the start, otherwise the current node's connections.
export function reachable(map: RunMap, position: string | null): MapNode[] {
  if (position === null) return map.floors[0];
  const current = findNode(map, position);
  return (current?.next ?? []).map((id) => findNode(map, id)!).filter(Boolean);
}
