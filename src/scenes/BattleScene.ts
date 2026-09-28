import { PALETTE } from '../art/palette';
import { spriteCanvas, TRANSPARENT, type SpriteDef } from '../art/sprite';
import { SPRITES } from '../art/sprites';
import { Battle } from '../combat/battle';
import { KNIGHT, SLIME } from '../combat/data';
import type { BattleEvent, Combatant } from '../combat/types';
import { seededRng } from '../engine/random';
import { NATIVE_HEIGHT, NATIVE_WIDTH } from '../engine/renderer';
import type { GameContext, Scene } from '../engine/scene';
import { CHAR_ADVANCE, drawText, textWidth } from '../ui/font';

const WALL_H = 40;
const SIDEBAR_W = 152;
const FIELD_CENTER_X = SIDEBAR_W + (NATIVE_WIDTH - SIDEBAR_W) / 2;
const ROW_TOPS = [52, 126, 200];
const PARTY_X = 186;
const ENEMY_COLUMN_X = [292, 346, 400];
const SKILL_SLOTS = 4;

const CARD_X = 4;
const CARD_W = 144;
const CARD_H = 70;
const CARD_OFFSET_Y = -8;

const ATTACK_TIME = 0.3;
const LUNGE_PX = 6;
const FLASH_TIME = 0.1;
const DEATH_FADE = 0.6;
const FIRE_HIGHLIGHT = 0.15;
const FLOAT_TIME = 0.8;
const MERGE_WINDOW = 0.25;
// Rises one full text line (8px) per merge window, so floats spawned outside the window never overlap.
const FLOAT_RISE_PER_SEC = 32;
const POP_TIME = 0.1;
const RESULT_DELAY = 1.0;

interface SpriteSet {
  idle: HTMLCanvasElement;
  attack: HTMLCanvasElement;
  flash: HTMLCanvasElement;
  topRow: number;
}

interface Anim {
  attack: number;
  flash: number;
  death: number;
  lastFired: number[];
}

interface FloatText {
  target: string;
  damage: number;
  absorbed: number;
  barrier: number;
  age: number;
  pop: number;
}

export class BattleScene implements Scene {
  private battle!: Battle;
  private anims = new Map<string, Anim>();
  private floats: FloatText[] = [];
  private endedFor = 0;
  private sprites = new Map<string, SpriteSet>();

  constructor(private game: GameContext) {
    for (const [id, def] of Object.entries(SPRITES)) {
      this.sprites.set(id, {
        idle: spriteCanvas(def, 'idle'),
        attack: spriteCanvas(def, 'attack'),
        flash: spriteCanvas(def, 'idle', 'white'),
        topRow: firstOpaqueRow(def),
      });
    }
  }

  enter(): void {
    this.start();
  }

  private start(): void {
    this.battle = new Battle([KNIGHT, KNIGHT, KNIGHT], Array.from({ length: 9 }, () => SLIME));
    this.anims.clear();
    for (const c of this.battle.combatants) {
      this.anims.set(c.uid, { attack: 0, flash: 0, death: 0, lastFired: c.slots.map(() => -Infinity) });
    }
    this.floats = [];
    this.endedFor = 0;
  }

  update(dt: number): void {
    const clicks = this.game.input.consumeClicks();
    if (this.battle.result && this.endedFor >= RESULT_DELAY && clicks.length > 0) {
      this.start();
      return;
    }

    for (const f of this.floats) {
      f.age += dt;
      f.pop = Math.max(0, f.pop - dt);
    }
    this.floats = this.floats.filter((f) => f.age < FLOAT_TIME);
    for (const event of this.battle.tick(dt)) this.handle(event);

    for (const anim of this.anims.values()) {
      anim.attack = Math.max(0, anim.attack - dt);
      anim.flash = Math.max(0, anim.flash - dt);
    }
    for (const c of this.battle.combatants) {
      if (c.hp <= 0) this.anim(c.uid).death += dt;
    }
    if (this.battle.result) this.endedFor += dt;
  }

  private handle(event: BattleEvent): void {
    switch (event.type) {
      case 'skill': {
        const actor = this.battle.get(event.actor);
        const anim = this.anim(actor.uid);
        anim.attack = ATTACK_TIME;
        anim.lastFired[actor.slots.findIndex((s) => s.def.id === event.skill)] = this.battle.elapsed;
        break;
      }
      case 'damage':
        this.anim(event.target).flash = FLASH_TIME;
        this.float(event.target, { damage: event.amount, absorbed: event.absorbed });
        break;
      case 'barrier':
        this.float(event.target, { barrier: event.amount });
        break;
      case 'death':
      case 'end':
        break;
    }
  }

  private anim(uid: string): Anim {
    const a = this.anims.get(uid);
    if (!a) throw new Error(`No anim state for ${uid}`);
    return a;
  }

  private float(target: string, add: Partial<Pick<FloatText, 'damage' | 'absorbed' | 'barrier'>>): void {
    const existing = this.floats.find((f) => f.target === target && f.age < MERGE_WINDOW);
    if (existing) {
      existing.damage += add.damage ?? 0;
      existing.absorbed += add.absorbed ?? 0;
      existing.barrier += add.barrier ?? 0;
      existing.age = 0;
      existing.pop = POP_TIME;
      return;
    }
    this.floats.push({
      target,
      damage: add.damage ?? 0,
      absorbed: add.absorbed ?? 0,
      barrier: add.barrier ?? 0,
      age: 0,
      pop: 0,
    });
  }

  render(ctx: CanvasRenderingContext2D): void {
    drawBackground(ctx);

    const party = this.battle.combatants.filter((c) => c.side === 'party');
    party.forEach((c) => this.drawCard(ctx, c));

    for (const c of this.battle.combatants) this.drawCombatant(ctx, c);
    for (const f of this.floats) this.drawFloat(ctx, f);

    const time = `TIME ${this.battle.elapsed.toFixed(1)}`;
    drawText(ctx, time, FIELD_CENTER_X - textWidth(time) / 2, 16, PALETTE.sand);

    if (this.battle.result && this.endedFor >= RESULT_DELAY) this.drawResult(ctx, this.battle.result === 'victory');
  }

  private spriteSet(c: Combatant): SpriteSet {
    const set = this.sprites.get(c.def.id);
    if (!set) throw new Error(`No sprite for ${c.def.id}`);
    return set;
  }

  private drawCombatant(ctx: CanvasRenderingContext2D, c: Combatant): void {
    const anim = this.anim(c.uid);
    const alpha = c.hp > 0 ? 1 : Math.max(0, 1 - anim.death / DEATH_FADE);
    if (alpha <= 0) return;

    const set = this.spriteSet(c);
    const { x, y } = slotPosition(c);
    const attacking = anim.attack > 0;
    const progress = attacking ? 1 - anim.attack / ATTACK_TIME : 0;
    const lunge = Math.round(Math.sin(progress * Math.PI) * LUNGE_PX) * (c.side === 'party' ? 1 : -1);
    const img = anim.flash > 0 ? set.flash : attacking ? set.attack : set.idle;

    ctx.globalAlpha = alpha;
    ctx.drawImage(img, x + lunge, y);
    ctx.globalAlpha = 1;
    if (c.hp <= 0 || c.side === 'party') return;

    drawBar(ctx, x, y + 34, 32, 3, c.hp / c.def.stats.hp, PALETTE.green);
    const slot = c.slots[0];
    if (slot) drawBar(ctx, x, y + 38, 32, 2, slot.timer / slot.def.cooldown, PALETTE.gold);
  }

  private drawFloat(ctx: CanvasRenderingContext2D, f: FloatText): void {
    const segments: { text: string; color: string }[] = [];
    if (f.damage > 0) segments.push({ text: `-${f.damage}`, color: PALETTE.red });
    if (f.absorbed > 0) segments.push({ text: `(${f.absorbed})`, color: PALETTE.cyan });
    if (f.barrier > 0) segments.push({ text: `+${f.barrier}`, color: PALETTE.cyan });
    if (segments.length === 0) return;

    const target = this.battle.get(f.target);
    const { x, y } = slotPosition(target);
    const scale = f.pop > 0 ? 2 : 1;
    const full = segments.map((s) => s.text).join(' ');
    const baseline = y + this.spriteSet(target).topRow - 3 - f.age * FLOAT_RISE_PER_SEC;
    let cursor = x + 16 - textWidth(full, scale) / 2;
    for (const s of segments) {
      drawText(ctx, s.text, cursor, baseline - 7 * scale, s.color, PALETTE.black, scale);
      cursor += (s.text.length + 1) * CHAR_ADVANCE * scale;
    }
  }

  private drawCard(ctx: CanvasRenderingContext2D, c: Combatant): void {
    const alive = c.hp > 0;
    const cx = CARD_X;
    const cy = ROW_TOPS[c.position] + CARD_OFFSET_Y;

    ctx.fillStyle = PALETTE.black;
    ctx.fillRect(cx, cy, CARD_W, CARD_H);
    ctx.fillStyle = alive ? PALETTE.darkSlate : PALETTE.night;
    ctx.fillRect(cx, cy, CARD_W, 1);
    ctx.fillRect(cx, cy + CARD_H - 1, CARD_W, 1);
    ctx.fillRect(cx, cy, 1, CARD_H);
    ctx.fillRect(cx + CARD_W - 1, cy, 1, CARD_H);

    const inner = cx + 5;
    const innerW = CARD_W - 10;
    drawText(ctx, c.def.name, inner, cy + 5, alive ? PALETTE.white : PALETTE.slate);
    const hp = `${c.hp}/${c.def.stats.hp}`;
    drawText(ctx, hp, inner + innerW - textWidth(hp), cy + 5, alive ? PALETTE.green : PALETTE.slate);
    drawBar(ctx, inner, cy + 15, innerW, 4, c.hp / c.def.stats.hp, PALETTE.green);
    if (c.barrier) drawBar(ctx, inner, cy + 20, innerW, 1, c.barrier.amount / c.def.stats.hp, PALETTE.cyan, false);

    const anim = this.anim(c.uid);
    for (let i = 0; i < SKILL_SLOTS; i++) {
      const rowY = cy + 25 + i * 10;
      const slot = c.slots[i];
      if (!slot) {
        drawText(ctx, '- EMPTY -', inner, rowY, PALETTE.night, null);
        continue;
      }
      drawText(ctx, slot.def.name, inner, rowY, alive ? PALETTE.lightGray : PALETTE.slate);
      const barX = inner + 70;
      const barW = innerW - 70;
      const justFired = !this.battle.result && this.battle.elapsed - anim.lastFired[i] < FIRE_HIGHLIGHT;
      const fill = !alive ? 0 : justFired ? 1 : slot.timer / slot.def.cooldown;
      drawBar(ctx, barX, rowY + 1, barW, 5, fill, justFired ? PALETTE.white : PALETTE.gold, false);
    }
  }

  private drawResult(ctx: CanvasRenderingContext2D, victory: boolean): void {
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = PALETTE.black;
    ctx.fillRect(0, 0, NATIVE_WIDTH, NATIVE_HEIGHT);
    ctx.globalAlpha = 1;

    const w = 180;
    const h = 52;
    const bx = (NATIVE_WIDTH - w) / 2;
    const by = (NATIVE_HEIGHT - h) / 2;
    const accent = victory ? PALETTE.gold : PALETTE.red;
    ctx.fillStyle = PALETTE.black;
    ctx.fillRect(bx, by, w, h);
    ctx.fillStyle = accent;
    ctx.fillRect(bx, by, w, 1);
    ctx.fillRect(bx, by + h - 1, w, 1);
    ctx.fillRect(bx, by, 1, h);
    ctx.fillRect(bx + w - 1, by, 1, h);

    const title = victory ? 'VICTORY' : 'DEFEAT';
    drawText(ctx, title, (NATIVE_WIDTH - textWidth(title)) / 2, by + 14, accent);
    const hint = 'CLICK TO FIGHT AGAIN';
    drawText(ctx, hint, (NATIVE_WIDTH - textWidth(hint)) / 2, by + 32, PALETTE.gray);
  }
}

// Party: one per row, aligned with its sidebar card. Enemies: 3x3 grid, column 0 is the front line.
function slotPosition(c: Combatant): { x: number; y: number } {
  if (c.side === 'party') return { x: PARTY_X, y: ROW_TOPS[c.position] };
  return { x: ENEMY_COLUMN_X[Math.floor(c.position / 3)], y: ROW_TOPS[c.position % 3] };
}

function firstOpaqueRow(def: SpriteDef): number {
  const rows = def.frames.idle;
  const index = rows.findIndex((row) => [...row].some((ch) => ch !== TRANSPARENT));
  return Math.max(0, index);
}

function drawBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  ratio: number,
  color: string,
  outlined = true,
): void {
  if (outlined) {
    ctx.fillStyle = PALETTE.black;
    ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  }
  ctx.fillStyle = PALETTE.night;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, Math.ceil(Math.max(0, Math.min(1, ratio)) * w), h);
}

function drawBackground(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = PALETTE.darkBrown;
  ctx.fillRect(0, 0, NATIVE_WIDTH, NATIVE_HEIGHT);

  ctx.fillStyle = PALETTE.deepBrown;
  ctx.fillRect(0, 0, NATIVE_WIDTH, WALL_H);
  ctx.fillStyle = PALETTE.black;
  for (let y = 0; y < WALL_H; y += 10) {
    ctx.fillRect(0, y, NATIVE_WIDTH, 1);
    const offset = (y / 10) % 2 === 0 ? 0 : 12;
    for (let x = offset; x < NATIVE_WIDTH; x += 24) ctx.fillRect(x, y, 1, 10);
  }
  ctx.fillStyle = PALETTE.brown;
  ctx.fillRect(0, WALL_H, NATIVE_WIDTH, 1);

  for (const s of DIRT_SPECKS) {
    ctx.fillStyle = s.color;
    ctx.fillRect(s.x, s.y, s.w, s.h);
  }
}

interface Speck {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

// Fixed seed: scattered-looking dirt that stays identical every frame.
const DIRT_SPECKS: Speck[] = (() => {
  const rng = seededRng(1337);
  const colors = [PALETTE.brown, PALETTE.brown, PALETTE.deepBrown, PALETTE.deepBrown, PALETTE.rust];
  const sizes = [
    [1, 1],
    [1, 1],
    [2, 1],
    [1, 2],
    [2, 2],
  ];
  return Array.from({ length: 160 }, () => {
    const [w, h] = sizes[Math.floor(rng() * sizes.length)];
    return {
      x: Math.floor(rng() * NATIVE_WIDTH),
      y: WALL_H + 3 + Math.floor(rng() * (NATIVE_HEIGHT - WALL_H - 5)),
      w,
      h,
      color: colors[Math.floor(rng() * colors.length)],
    };
  });
})();
