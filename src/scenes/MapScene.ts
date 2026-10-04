import { MAP_ICONS } from '../art/mapIcons';
import { PALETTE } from '../art/palette';
import { spriteCanvas } from '../art/sprite';
import { NATIVE_WIDTH } from '../engine/renderer';
import type { GameContext, Scene } from '../engine/scene';
import { enterNode, reviewReward } from '../run/flow';
import { FLOORS, type MapNode, type NodeType } from '../run/map';
import { currentNode, nextNodes, roomType, type RunState } from '../run/run';
import { drawBackground } from '../ui/background';
import { drawText, textWidth } from '../ui/font';
import { drawButton, drawFrame, drawPanel, inside, type Button, type Rect } from '../ui/widgets';
import { PartyScene } from './PartyScene';
import { StoreScene } from './StoreScene';

// Floors run left to right so the whole map fits on screen without scrolling.
const FLOOR_X0 = 24;
const FLOOR_STEP = 28;
const COLUMN_Y0 = 62;
const COLUMN_STEP = 29;
const JITTER = 3;
const BOSS_X = 452;
const DOT_GAP = 4;
const DOT_SIZE = 2;
const BOB_SPEED = 5;
const PARTY: Button = { x: 404, y: 10, w: 68, h: 20, label: 'PARTY' };
const TITLE = 'CHOOSE YOUR PATH';

const NODE_LABEL: Record<NodeType, string> = {
  battle: 'BATTLE',
  epic: 'EPIC MONSTER',
  event: 'UNKNOWN',
  store: 'STORE',
  treasure: 'TREASURE',
  boss: 'BOSS',
};

export class MapScene implements Scene {
  private icons = Object.fromEntries(Object.entries(MAP_ICONS).map(([k, def]) => [k, spriteCanvas(def, 'idle')])) as Record<
    NodeType,
    HTMLCanvasElement
  >;
  private time = 0;

  constructor(private game: GameContext) {}

  enter(): void {
    this.game.input.consumeClicks();
  }

  private get run(): RunState {
    return this.game.state.run!;
  }

  update(dt: number): void {
    this.time += dt;
    for (const click of this.game.input.consumeClicks()) {
      if (inside(click, PARTY)) return this.game.scenes.switchTo(new PartyScene(this.game));
      const node = nextNodes(this.run).find((n) => inside(click, this.nodeRect(n)));
      if (node) return enterNode(this.game, node);
      const last = this.reviewable();
      if (last && inside(click, this.nodeRect(last))) {
        return roomType(this.run, last) === 'store' ? this.game.scenes.switchTo(new StoreScene(this.game)) : reviewReward(this.game);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    drawBackground(ctx);
    const run = this.run;
    const current = currentNode(run);
    const floor = current ? current.floor + 1 : 0;
    drawText(ctx, `LEVEL ${run.level + 1}`, 8, 8, PALETTE.gold);
    drawText(ctx, `ROOM ${floor}/${FLOORS}`, 8, 22, PALETTE.lightGray);
    drawText(ctx, TITLE, (NATIVE_WIDTH - textWidth(TITLE)) / 2, 16, PALETTE.sand);
    const gold = `GOLD ${run.gold}`;
    drawText(ctx, gold, PARTY.x - 10 - textWidth(gold), 16, PALETTE.gold);
    const pointer = this.game.input.pointer;
    drawButton(ctx, PARTY, inside(pointer, PARTY));

    const nodes = [...run.map.floors.flat(), run.map.boss];
    const open = new Set(nextNodes(run).map((n) => n.id));
    const path = new Set(run.path);
    this.drawEdges(ctx, nodes, open, path);

    let hovered: MapNode | null = null;
    for (const node of nodes) {
      const rect = this.nodeRect(node);
      if (inside(pointer, rect)) hovered = node;
      const here = node.id === run.position;
      this.drawNode(ctx, node, rect, open.has(node.id), path.has(node.id), here, hovered === node && (here ? !!this.reviewable() : true), floor);
    }
    if (hovered) this.drawLabel(ctx, this.hoverLabel(hovered), pointer);
  }

  // The node just cleared, while its reward picks can still be changed or its store revisited.
  private reviewable(): MapNode | null {
    const run = this.run;
    const reward = run.lastReward?.node === run.position;
    const store = run.store?.node === run.position;
    return run.position && (reward || store) ? currentNode(run) : null;
  }

  private hoverLabel(node: MapNode): string {
    if (node !== this.reviewable()) return NODE_LABEL[node.type];
    return roomType(this.run, node) === 'store' ? 'REVISIT STORE' : 'REVIEW REWARDS';
  }

  private drawEdges(ctx: CanvasRenderingContext2D, nodes: MapNode[], open: Set<string>, path: Set<string>): void {
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const position = this.run.position;
    for (const node of nodes) {
      for (const id of node.next) {
        const to = byId.get(id)!;
        const walked = path.has(node.id) && path.has(id);
        const ahead = node.id === position && open.has(id);
        const color = walked ? PALETTE.gold : ahead ? PALETTE.white : PALETTE.black;
        drawDots(ctx, this.center(node), this.center(to), color);
      }
    }
  }

  private drawNode(
    ctx: CanvasRenderingContext2D,
    node: MapNode,
    rect: Rect,
    open: boolean,
    walked: boolean,
    here: boolean,
    hover: boolean,
    floor: number,
  ): void {
    const passed = node.floor < floor && !walked;
    const bob = open ? Math.round(Math.sin(this.time * BOB_SPEED) * 1) : 0;
    ctx.globalAlpha = passed ? 0.3 : walked && !here ? 0.5 : 1;
    ctx.drawImage(this.icons[node.type], rect.x, rect.y + bob);
    ctx.globalAlpha = 1;
    const frame = { x: rect.x - 2, y: rect.y - 2 + bob, w: rect.w + 4, h: rect.h + 4 };
    if (here) drawFrame(ctx, frame, hover ? PALETTE.white : PALETTE.gold);
    else if (open && hover) drawFrame(ctx, frame, PALETTE.white);
    else if (open) drawFrame(ctx, frame, PALETTE.sand);
  }

  private drawLabel(ctx: CanvasRenderingContext2D, label: string, pointer: { x: number; y: number }): void {
    const w = textWidth(label) + 10;
    const x = Math.min(pointer.x + 8, NATIVE_WIDTH - w - 2);
    const y = pointer.y + 12 > 250 ? pointer.y - 20 : pointer.y + 12;
    drawPanel(ctx, { x, y, w, h: 13 }, PALETTE.gold);
    drawText(ctx, label, x + 5, y + 3, PALETTE.white);
  }

  private center(node: MapNode): { x: number; y: number } {
    if (node.type === 'boss') return { x: BOSS_X, y: COLUMN_Y0 + 3 * COLUMN_STEP };
    const [jx, jy] = jitter(node.id);
    return { x: FLOOR_X0 + node.floor * FLOOR_STEP + jx, y: COLUMN_Y0 + node.column * COLUMN_STEP + jy };
  }

  private nodeRect(node: MapNode): Rect {
    const { x, y } = this.center(node);
    const size = MAP_ICONS[node.type].width;
    return { x: x - size / 2, y: y - size / 2, w: size, h: size };
  }
}

// Small fixed offsets per node so the grid doesn't look ruled.
function jitter(id: string): [number, number] {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const span = JITTER * 2 + 1;
  return [(h % span) - JITTER, (Math.floor(h / span) % span) - JITTER];
}

function drawDots(ctx: CanvasRenderingContext2D, a: { x: number; y: number }, b: { x: number; y: number }, color: string): void {
  const dist = Math.hypot(b.x - a.x, b.y - a.y);
  const steps = Math.floor(dist / DOT_GAP);
  ctx.fillStyle = color;
  // Skip the dots hidden under the icons at either end.
  for (let i = 2; i < steps - 1; i++) {
    const t = i / steps;
    ctx.fillRect(Math.round(a.x + (b.x - a.x) * t) - 1, Math.round(a.y + (b.y - a.y) * t) - 1, DOT_SIZE, DOT_SIZE);
  }
}
