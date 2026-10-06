import { PALETTE } from '../art/palette';
import { spriteCanvas } from '../art/sprite';
import { SPRITES } from '../art/sprites';
import { NATIVE_WIDTH } from '../engine/renderer';
import { CLASSES } from '../content/classes';
import { loadSlot, SAVE_SLOTS, type SlotInfo } from '../engine/save';
import type { GameContext, Scene } from '../engine/scene';
import { FLOORS, findNode } from '../run/map';
import { downloadLogs, finishedLogs } from '../run/log';
import { deleteProfile, hasProfile, loadProfile, type Profile } from '../run/profile';
import { loadRun, type SavedRun } from '../run/run';
import { drawBackground } from '../ui/background';
import { drawText, textWidth } from '../ui/font';
import { drawButton, drawPanel, inside, type Button, type Rect } from '../ui/widgets';
import { DebugScene } from './DebugScene';
import { MapScene } from './MapScene';
import { RosterScene } from './RosterScene';
import { StatsScene } from './StatsScene';

const TITLE = 'DUN-DUN-DUNGEON';
const TITLE_SCALE = 3;
const SLOT_W = 148;
const SLOT_H = 150;
const SLOT_GAP = 8;
const SLOTS_TOP = 56;
const DEBUG: Button = { x: NATIVE_WIDTH / 2 - 104, y: 238, w: 100, h: 20, label: 'DEBUG' };
// Downloads the last few finished runs' logs as JSON.
const LOGS: Button = { x: NATIVE_WIDTH / 2 + 4, y: 238, w: 100, h: 20, label: 'RUN LOGS' };

interface SlotView {
  rect: Rect;
  save: SlotInfo<SavedRun> | null;
  // Null for a slot that has never been played.
  profile: Profile | null;
  main: Button;
  stats: Button;
  remove: Button;
}

// Start screen: three save slots, each a player profile (unlocks and lifetime stats) with an optional run in
// progress: new run or continue, stats, and delete. Plus the debug screen.
export class TitleScene implements Scene {
  private slots: SlotView[] = [];
  private confirmDelete: number | null = null;
  private keptLogs = 0;
  private sprites = new Map<string, HTMLCanvasElement>();

  constructor(private game: GameContext) {}

  enter(): void {
    this.game.input.consumeClicks();
    this.refresh();
  }

  private refresh(): void {
    this.keptLogs = finishedLogs().length;
    const left = (NATIVE_WIDTH - (SLOT_W * SAVE_SLOTS + SLOT_GAP * (SAVE_SLOTS - 1))) / 2;
    this.slots = Array.from({ length: SAVE_SLOTS }, (_, i) => {
      const rect = { x: left + i * (SLOT_W + SLOT_GAP), y: SLOTS_TOP, w: SLOT_W, h: SLOT_H };
      const save = loadSlot<SavedRun>(i);
      const profile = save || hasProfile(i) ? loadProfile(i) : null;
      return {
        rect,
        save,
        profile,
        main: { x: rect.x + 6, y: rect.y + rect.h - 26, w: 82, h: 20, label: save ? 'CONTINUE' : 'NEW RUN' },
        stats: { x: rect.x + 92, y: rect.y + rect.h - 26, w: 50, h: 20, label: 'STATS' },
        remove: { x: rect.x + rect.w - 58, y: rect.y + 5, w: 52, h: 11, label: 'DELETE' },
      };
    });
  }

  update(): void {
    for (const click of this.game.input.consumeClicks()) {
      if (inside(click, DEBUG)) return this.game.scenes.switchTo(new DebugScene(this.game));
      if (inside(click, LOGS) && this.keptLogs > 0) {
        downloadLogs();
        continue;
      }
      const index = this.slots.findIndex((s) => inside(click, s.rect));
      if (index < 0) {
        this.confirmDelete = null;
        continue;
      }
      const slot = this.slots[index];
      if (slot.profile && inside(click, slot.remove)) {
        if (this.confirmDelete === index) {
          deleteProfile(index);
          this.confirmDelete = null;
          this.refresh();
        } else this.confirmDelete = index;
        continue;
      }
      this.confirmDelete = null;
      if (slot.profile && inside(click, slot.stats)) return this.game.scenes.switchTo(new StatsScene(this.game, index));
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
    drawButton(ctx, { ...LOGS, label: `RUN LOGS (${this.keptLogs})` }, this.keptLogs > 0 && inside(pointer, LOGS));
  }

  private drawSlot(ctx: CanvasRenderingContext2D, s: SlotView, index: number, pointer: { x: number; y: number }): void {
    const { rect, profile } = s;
    drawPanel(ctx, rect, inside(pointer, rect) ? PALETTE.lightGray : PALETTE.darkSlate);
    drawText(ctx, `SLOT ${index + 1}`, rect.x + 6, rect.y + 6, PALETTE.sand);
    drawButton(ctx, s.main, inside(pointer, s.main));

    if (!profile) {
      const empty = 'EMPTY';
      drawText(ctx, empty, rect.x + (rect.w - textWidth(empty)) / 2, rect.y + 58, PALETTE.slate);
      return;
    }

    const confirming = this.confirmDelete === index;
    drawButton(ctx, { ...s.remove, label: confirming ? 'SURE?' : 'DELETE' }, confirming || inside(pointer, s.remove));
    drawButton(ctx, s.stats, inside(pointer, s.stats));

    if (s.save) {
      const { run, party } = s.save.data;
      party.forEach((m, i) => ctx.drawImage(this.sprite(m.classId), rect.x + 10 + i * 44, rect.y + 18));
      const node = run.position === null ? null : findNode(run.map, run.position);
      const floor = node ? Math.min(node.floor + 1, FLOORS) : 0;
      drawText(ctx, `ACT ${run.level + 1}  ROOM ${floor}/${FLOORS}`, rect.x + 6, rect.y + 53, PALETTE.white);
      const gold = `${run.gold} G`;
      drawText(ctx, gold, rect.x + rect.w - 6 - textWidth(gold), rect.y + 53, PALETTE.gold);
    } else {
      const idle = 'NO RUN IN PROGRESS';
      drawText(ctx, idle, rect.x + (rect.w - textWidth(idle)) / 2, rect.y + 36, PALETTE.slate);
    }

    const best = profile.best ? `ACT ${profile.best.level + 1} ROOM ${profile.best.room}` : '-';
    const lines: [string, string][] = [
      [`RUNS ${profile.runs}  WINS ${profile.wins}`, PALETTE.lightGray],
      [`BEST ${best}`, PALETTE.lightGray],
      [`BOSSES ${profile.bosses}  EPICS ${profile.epics}`, PALETTE.lightGray],
      [`CLASSES ${profile.unlocked.length}/${CLASSES.length}`, PALETTE.green],
    ];
    lines.forEach(([text, color], i) => drawText(ctx, text, rect.x + 6, rect.y + 70 + i * 11, color));
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

