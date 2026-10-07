import { PALETTE } from '../art/palette';
import { drawFitted, spriteCanvas } from '../art/sprite';
import { SPRITES } from '../art/sprites';
import type { CombatantDef } from '../combat/types';
import { ENEMIES } from '../content/enemies';
import { NATIVE_WIDTH } from '../engine/renderer';
import type { GameContext, Scene } from '../engine/scene';
import { drawBackground } from '../ui/background';
import { skillLines, wrap, type Line } from '../ui/describeLines';
import { drawText, textWidth } from '../ui/font';
import { drawButton, drawPanel, inside, type Button, type Rect } from '../ui/widgets';

const BACK: Button = { x: 8, y: 10, w: 60, h: 20, label: 'BACK' };
const SEARCH: Rect = { x: 8, y: 46, w: 120, h: 11 };
const SEARCH_MAX = 16;
const GRID: Rect = { x: 8, y: 62, w: 308, h: 200 };
const COLUMNS = 4;
const CHIP_W = 76;
const CHIP_H = 66;
const VISIBLE_ROWS = 3;
const DETAIL: Rect = { x: 322, y: 46, w: 150, h: 216 };
const STATS: [keyof CombatantDef['stats'], string][] = [
  ['hp', 'HP'],
  ['attack', 'ATK'],
  ['magic', 'MAG'],
  ['defense', 'DEF'],
  ['resistance', 'RES'],
];

// Full-screen monster list for the debug encounter grid: EMPTY first, then every enemy, searchable and scrollable.
export class MonsterPickerScene implements Scene {
  private sprites = new Map<string, HTMLCanvasElement>();
  private search = '';
  private scroll = 0;

  constructor(
    private game: GameContext,
    private current: CombatantDef | null,
    private choose: (def: CombatantDef | null) => void,
    private back: () => void,
  ) {}

  enter(): void {
    this.game.input.consumeClicks();
    this.game.input.consumeTyped();
    this.game.input.consumeWheel();
  }

  private options(): (CombatantDef | null)[] {
    const matches = ENEMIES.filter((e) => e.name.toUpperCase().includes(this.search));
    return this.search ? matches : [null, ...matches];
  }

  update(): void {
    const input = this.game.input;
    for (const key of input.consumeTyped()) {
      if (key === 'Backspace') this.search = this.search.slice(0, -1);
      else if (key === 'Escape') this.search = '';
      else if (/^[a-z0-9 ']$/i.test(key) && this.search.length < SEARCH_MAX) this.search += key.toUpperCase();
      else continue;
      this.scroll = 0;
    }
    const options = this.options();
    const maxScroll = Math.max(0, Math.ceil(options.length / COLUMNS) - VISIBLE_ROWS);
    this.scroll = Math.min(maxScroll, Math.max(0, this.scroll + input.consumeWheel()));

    for (const click of input.consumeClicks()) {
      if (inside(click, BACK)) return this.back();
      const index = this.visible(options).find(({ rect }) => inside(click, rect))?.index;
      if (index !== undefined) return this.choose(options[index]);
    }
  }

  // Chips on screen right now, with their index into the option list.
  private visible(options: (CombatantDef | null)[]): { index: number; rect: Rect }[] {
    const first = this.scroll * COLUMNS;
    const last = Math.min(options.length, first + VISIBLE_ROWS * COLUMNS);
    const chips: { index: number; rect: Rect }[] = [];
    for (let index = first; index < last; index++) {
      const slot = index - first;
      chips.push({
        index,
        rect: { x: GRID.x + (slot % COLUMNS) * CHIP_W, y: GRID.y + Math.floor(slot / COLUMNS) * CHIP_H, w: CHIP_W - 4, h: CHIP_H - 4 },
      });
    }
    return chips;
  }

  render(ctx: CanvasRenderingContext2D): void {
    drawBackground(ctx);
    const title = 'PICK A MONSTER';
    drawText(ctx, title, (NATIVE_WIDTH - textWidth(title)) / 2, 16, PALETTE.sand);
    const pointer = this.game.input.pointer;
    drawButton(ctx, BACK, inside(pointer, BACK));

    drawPanel(ctx, SEARCH, this.search ? PALETTE.lightGray : PALETTE.darkSlate);
    drawText(ctx, this.search || 'TYPE TO SEARCH', SEARCH.x + 3, SEARCH.y + 2, this.search ? PALETTE.white : PALETTE.slate);
    const options = this.options();
    const found = options.filter(Boolean).length;
    const count = `${found} MONSTER${found === 1 ? '' : 'S'}`;
    drawText(ctx, count, GRID.x + GRID.w - 4 - textWidth(count), SEARCH.y + 2, PALETTE.slate);

    let hovered: CombatantDef | null | undefined;
    for (const { index, rect } of this.visible(options)) {
      const def = options[index];
      const hover = inside(pointer, rect);
      if (hover) hovered = def;
      const selected = (def?.id ?? null) === (this.current?.id ?? null);
      drawPanel(ctx, rect, selected ? PALETTE.gold : hover ? PALETTE.lightGray : PALETTE.darkSlate);
      if (!def) {
        drawText(ctx, 'EMPTY', rect.x + (rect.w - textWidth('EMPTY')) / 2, rect.y + 28, PALETTE.slate);
        continue;
      }
      drawFitted(ctx, this.sprite(def.id), rect.x + (rect.w - 32) / 2, rect.y + 4);
      const name = def.name.toUpperCase();
      drawText(ctx, name, rect.x + (rect.w - textWidth(name)) / 2, rect.y + 42, PALETTE.white);
      const hp = `HP ${def.stats.hp}`;
      drawText(ctx, hp, rect.x + (rect.w - textWidth(hp)) / 2, rect.y + 52, PALETTE.slate);
    }
    this.drawScrollbar(ctx, options.length);
    this.drawDetail(ctx, hovered === undefined ? this.current : hovered);
  }

  private drawScrollbar(ctx: CanvasRenderingContext2D, count: number): void {
    const rows = Math.ceil(count / COLUMNS);
    if (rows <= VISIBLE_ROWS) return;
    const track: Rect = { x: GRID.x + GRID.w - 3, y: GRID.y, w: 3, h: VISIBLE_ROWS * CHIP_H - 4 };
    ctx.fillStyle = PALETTE.night;
    ctx.fillRect(track.x, track.y, track.w, track.h);
    const thumbH = Math.max(8, Math.round((track.h * VISIBLE_ROWS) / rows));
    const thumbY = track.y + Math.round(((track.h - thumbH) * this.scroll) / (rows - VISIBLE_ROWS));
    ctx.fillStyle = PALETTE.slate;
    ctx.fillRect(track.x, thumbY, track.w, thumbH);
  }

  private drawDetail(ctx: CanvasRenderingContext2D, def: CombatantDef | null): void {
    drawPanel(ctx, DETAIL, PALETTE.darkSlate);
    const x = DETAIL.x + 6;
    if (!def) {
      drawText(ctx, 'EMPTY CELL', x, DETAIL.y + 6, PALETTE.slate);
      return;
    }
    const lines: Line[] = [{ text: def.name.toUpperCase(), color: PALETTE.white }];
    lines.push({ text: STATS.slice(0, 3).map(([k, l]) => `${l} ${def.stats[k]}`).join('  '), color: PALETTE.lightGray });
    lines.push({ text: STATS.slice(3).map(([k, l]) => `${l} ${def.stats[k]}`).join('  '), color: PALETTE.lightGray });
    const resist = Object.entries(def.resist ?? {}).map(([el, v]) => `${el.toUpperCase()} ${v! > 0 ? '+' : ''}${Math.round(v! * 100)}%`);
    if (resist.length > 0) lines.push({ text: `RESIST ${resist.join(', ')}`, color: PALETTE.orange });
    for (const skill of def.skills) lines.push({ text: '', color: PALETTE.slate }, ...skillLines(skill));

    const maxChars = Math.floor((DETAIL.w - 12) / 6);
    let y = DETAIL.y + 6;
    for (const line of lines) {
      for (const text of line.text ? wrap(line.text, maxChars) : ['']) {
        if (y > DETAIL.y + DETAIL.h - 10) return;
        drawText(ctx, text, x, y, line.color);
        y += text ? 9 : 4;
      }
    }
  }

  private sprite(id: string): HTMLCanvasElement {
    let canvas = this.sprites.get(id);
    if (!canvas) {
      canvas = spriteCanvas(SPRITES[id], 'idle');
      this.sprites.set(id, canvas);
    }
    return canvas;
  }
}
