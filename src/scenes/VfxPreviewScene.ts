import { PALETTE } from '../art/palette';
import { spriteCanvas, TRANSPARENT } from '../art/sprite';
import { SPRITES } from '../art/sprites';
import { NATIVE_WIDTH } from '../engine/renderer';
import type { GameContext, Scene } from '../engine/scene';
import { drawBackground } from '../ui/background';
import { drawText, textWidth } from '../ui/font';
import { DOT_TIERS, VFX } from '../vfx/effects';

// Dev-only (?preview=vfx): every new VFX looping on a fitting sprite, for art approval.
interface Cell {
  vfx: string;
  sprite: string;
  label: string;
  // 'reveal': the sprite appears only when the effect ends (summon). 'morph': it turns into `after` then (transform).
  timing?: 'reveal' | 'morph';
  after?: string;
}

const STATUS_CELLS: Cell[] = [
  { vfx: 'summon', sprite: 'wolf', label: 'SUMMON', timing: 'reveal' },
  { vfx: 'transform', sprite: 'orc', label: 'TRANSFORM', timing: 'morph', after: 'critter' },
  { vfx: 'shapeshift', sprite: 'druid', label: 'SHAPESHIFT' },
  { vfx: 'slow', sprite: 'orc', label: 'SLOW' },
  { vfx: 'haste', sprite: 'knight', label: 'HASTE' },
  { vfx: 'chaos', sprite: 'orc', label: 'CHAOS' },
];
const DOT_ELEMENTS: [string, string][] = [
  ['none', 'BLEED'],
  ['fire', 'BURN'],
  ['ice', 'FROST'],
  ['lightning', 'SHOCK'],
  ['holy', 'HOLY'],
  ['shadow', 'SHADOW'],
  ['poison', 'POISON'],
];
const ROWS: Cell[][] = [
  STATUS_CELLS,
  ...Array.from({ length: DOT_TIERS }, (_, t) =>
    DOT_ELEMENTS.map(([el, name]) => ({ vfx: `dot:${el}:${t + 1}`, sprite: 'slime', label: `${name} ${t + 1}` })),
  ),
];
const ROW_TOP = 42;
const ROW_H = 57;
const PAUSE = 0.35;
// Before/after holds for the summon and transform cells, so each loop reads in one direction.
const LEAD = 0.6;
const HOLD = 0.9;
// A blank beat at the end of the hold marks the restart.
const RESET = 0.25;

export class VfxPreviewScene implements Scene {
  private sprites = new Map<string, HTMLCanvasElement>();
  private time = 0;

  constructor(private game: GameContext) {
    for (const c of ROWS.flat()) {
      for (const id of [c.sprite, c.after]) if (id && !this.sprites.has(id)) this.sprites.set(id, spriteCanvas(SPRITES[id], 'idle'));
    }
  }

  update(dt: number): void {
    this.time += dt;
    this.game.input.consumeClicks();
  }

  render(ctx: CanvasRenderingContext2D): void {
    drawBackground(ctx);
    const title = 'VFX PREVIEW';
    drawText(ctx, title, (NATIVE_WIDTH - textWidth(title)) / 2, 16, PALETTE.sand);
    ROWS.forEach((row, r) => {
      const cellW = NATIVE_WIDTH / row.length;
      row.forEach((c, i) => this.drawCell(ctx, c, i * cellW, ROW_TOP + r * ROW_H, cellW, r * 100 + i));
    });
  }

  private drawCell(ctx: CanvasRenderingContext2D, c: Cell, x: number, y: number, w: number, index: number): void {
    const def = VFX[c.vfx];
    const lead = c.timing ? LEAD : 0;
    const loop = lead + def.duration + (c.timing ? HOLD : PAUSE);
    const t = ((this.time % loop) - lead) / def.duration;
    const sx = Math.round(x + (w - 32) / 2);
    const playing = t >= 0 && t < 1;
    // Summon: empty, then the effect, then the creature. Transform: the original, the effect, then the result.
    const shown = c.timing === 'reveal' ? (t >= 1 ? c.sprite : null) : c.timing === 'morph' && t >= 1 ? c.after! : c.sprite;
    const resetting = c.timing && (this.time % loop) > loop - RESET;
    if (shown && !resetting) ctx.drawImage(this.sprites.get(shown)!, sx, y + 4);
    // A new seed each loop so the random parts vary like they do in battle.
    // Centered on the visible part of the sprite, as in battle.
    const top = SPRITES[c.sprite].frames.idle.findIndex((row) => [...row].some((ch) => ch !== TRANSPARENT));
    const cy = y + 4 + Math.round((Math.max(0, top) + 31) / 2);
    if (playing) def.draw(ctx, t, sx + 16, cy, index * 1000 + Math.floor(this.time / loop));
    drawText(ctx, c.label, x + (w - textWidth(c.label)) / 2, y + 40, PALETTE.lightGray);
  }
}
