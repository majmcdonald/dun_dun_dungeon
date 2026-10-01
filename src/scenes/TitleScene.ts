import { PALETTE } from '../art/palette';
import { spriteCanvas } from '../art/sprite';
import { SPRITES } from '../art/sprites';
import { NATIVE_WIDTH } from '../engine/renderer';
import { clearSlot, loadSlot, SAVE_SLOTS, type SlotInfo } from '../engine/save';
import type { GameContext, Scene } from '../engine/scene';
import { FLOORS, findNode } from '../run/map';
import { loadRun, type SavedRun } from '../run/run';
import { drawBackground } from '../ui/background';
import { drawText, textWidth } from '../ui/font';
import { drawButton, drawPanel, inside, type Button, type Rect } from '../ui/widgets';
import { DebugScene } from './DebugScene';
import { MapScene } from './MapScene';
import { RosterScene } from './RosterScene';

const TITLE = 'DUN-DUN-DUNGEON';
const TITLE_SCALE = 3;
const SLOT_W = 148;
const SLOT_H = 150;
const SLOT_GAP = 8;
const SLOTS_TOP = 56;
const DEBUG: Button = { x: (NATIVE_WIDTH - 100) / 2, y: 238, w: 100, h: 20, label: 'DEBUG' };

interface SlotView {
  rect: Rect;
  save: SlotInfo<SavedRun> | null;
  main: Button;
  remove: Button;
}

// Start screen: three save slots (new run, or continue with delete), plus the debug screen.
export class TitleScene implements Scene {
  private slots: SlotView[] = [];
  private confirmDelete: number | null = null;
  private sprites = new Map<string, HTMLCanvasElement>();

  constructor(private game: GameContext) {}

  enter(): void {
    this.game.input.consumeClicks();
    this.refresh();
  }

  private refresh(): void {
    const left = (NATIVE_WIDTH - (SLOT_W * SAVE_SLOTS + SLOT_GAP * (SAVE_SLOTS - 1))) / 2;
    this.slots = Array.from({ length: SAVE_SLOTS }, (_, i) => {
      const rect = { x: left + i * (SLOT_W + SLOT_GAP), y: SLOTS_TOP, w: SLOT_W, h: SLOT_H };
      const save = loadSlot<SavedRun>(i);
      return {
        rect,
        save,
        main: { x: rect.x + 8, y: rect.y + rect.h - 30, w: rect.w - 16, h: 20, label: save ? 'CONTINUE' : 'NEW RUN' },
        remove: { x: rect.x + rect.w - 58, y: rect.y + 5, w: 52, h: 11, label: 'DELETE' },
      };
    });
  }

  update(): void {
    for (const click of this.game.input.consumeClicks()) {
      if (inside(click, DEBUG)) return this.game.scenes.switchTo(new DebugScene(this.game));
      const index = this.slots.findIndex((s) => inside(click, s.rect));
      if (index < 0) {
        this.confirmDelete = null;
        continue;
      }
      const slot = this.slots[index];
      if (slot.save && inside(click, slot.remove)) {
        if (this.confirmDelete === index) {
          clearSlot(index);
          this.confirmDelete = null;
          this.refresh();
        } else this.confirmDelete = index;
        continue;
      }
      this.confirmDelete = null;
      if (!inside(click, slot.main)) continue;
      if (!slot.save) return this.game.scenes.switchTo(new RosterScene(this.game, index));
      if (loadRun(index, this.game.state)) return this.game.scenes.switchTo(new MapScene(this.game));
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    drawBackground(ctx);
    const w = textWidth(TITLE, TITLE_SCALE);
    drawText(ctx, TITLE, (NATIVE_WIDTH - w) / 2, 10, PALETTE.gold, PALETTE.black, TITLE_SCALE);

    const pointer = this.game.input.pointer;
    this.slots.forEach((s, i) => this.drawSlot(ctx, s, i, pointer));
    drawButton(ctx, DEBUG, inside(pointer, DEBUG));
  }

  private drawSlot(ctx: CanvasRenderingContext2D, s: SlotView, index: number, pointer: { x: number; y: number }): void {
    const { rect } = s;
    drawPanel(ctx, rect, inside(pointer, rect) ? PALETTE.lightGray : PALETTE.darkSlate);
    drawText(ctx, `SLOT ${index + 1}`, rect.x + 6, rect.y + 6, PALETTE.sand);
    drawButton(ctx, s.main, inside(pointer, s.main));

    if (!s.save) {
      const empty = 'EMPTY';
      drawText(ctx, empty, rect.x + (rect.w - textWidth(empty)) / 2, rect.y + 58, PALETTE.slate);
      return;
    }

    const confirming = this.confirmDelete === index;
    drawButton(ctx, { ...s.remove, label: confirming ? 'SURE?' : 'DELETE' }, confirming || inside(pointer, s.remove));

    const { run, party } = s.save.data;
    party.forEach((m, i) => ctx.drawImage(this.sprite(m.classId), rect.x + 10 + i * 44, rect.y + 22));
    const node = run.position === null ? null : findNode(run.map, run.position);
    const floor = node ? Math.min(node.floor + 1, FLOORS) : 0;
    const lines: [string, string][] = [
      [`LEVEL ${run.level + 1}  ROOM ${floor}/${FLOORS}`, PALETTE.white],
      [`GOLD ${run.gold}`, PALETTE.gold],
      [`SAVED ${formatDate(s.save.savedAt)}`, PALETTE.slate],
    ];
    lines.forEach(([text, color], i) => drawText(ctx, text, rect.x + 6, rect.y + 62 + i * 11, color));
  }

  private sprite(classId: string): HTMLCanvasElement {
    let canvas = this.sprites.get(classId);
    if (!canvas) {
      canvas = spriteCanvas(SPRITES[classId], 'idle');
      this.sprites.set(classId, canvas);
    }
    return canvas;
  }
}

function formatDate(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
