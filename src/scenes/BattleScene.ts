import {
  BUFF_ICON,
  DEBUFF_ICON,
  DOT_ICON,
  HASTE_ICON,
  REGEN_ICON,
  SHAPESHIFT_ICON,
  SLOW_ICON,
  TAUNT_ICON,
} from '../art/icons';
import { PALETTE } from '../art/palette';
import { spriteCanvas, TRANSPARENT, type SpriteDef } from '../art/sprite';
import { SPRITES } from '../art/sprites';
import { Battle, gridCell, isSummon, MECHANIC } from '../combat/battle';
import { CREATURES } from '../content/creatures';
import { EQUIP_SLOTS, type BattleEvent, type Combatant, type CombatantDef, type EquipSlot } from '../combat/types';
import { NATIVE_HEIGHT, NATIVE_WIDTH } from '../engine/renderer';
import type { GameContext, Scene } from '../engine/scene';
import { drawBackground } from '../ui/background';
import { CHAR_ADVANCE, drawText, textWidth } from '../ui/font';
import { drawEquipmentIcons, drawEquipmentTooltip, hoveredSlot, ICON_STEP } from '../ui/partyCard';
import { dotVfxId, VFX } from '../vfx/effects';
import { loseRun, winNode } from '../run/flow';
import { currentEncounter } from '../run/encounters';
import { takeNextFight } from '../run/events';
import { itemRef } from '../run/run';
import { PreBattleScene } from './PreBattleScene';

const SIDEBAR_W = 152;
const FIELD_CENTER_X = SIDEBAR_W + (NATIVE_WIDTH - SIDEBAR_W) / 2;
const ROW_TOPS = [52, 126, 200];
const PARTY_X = 180;
// Summon columns, front-most first.
const SUMMON_X = [262, 220];
const ENEMY_COLUMN_X = [316, 370, 424];
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
const NOTICE_TIME = 1.5;
const NOTICE_RISE_PER_SEC = 10;
const STATUS_ICONS_MAX = 4;
// Statuses that play the VFX of the same name when applied.
const STATUS_VFX = new Set(['slow', 'haste', 'transform', 'shapeshift']);
const FAMILIAR_GHOST_ALPHA = 0.35;
const FRENZY_BLINK = 0.15;

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
  // Seconds left before a new summon shows up, and before a transformed unit turns into the critter:
  // each waits for its VFX to finish.
  hidden: number;
  morph: number;
  // Already drawn as the critter, so a refreshed transform doesn't replay the swap.
  critter: boolean;
}

interface FloatText {
  target: string;
  damage: number;
  absorbed: number;
  barrier: number;
  heal: number;
  age: number;
  pop: number;
}

interface ActiveVfx {
  id: string;
  target: string;
  age: number;
  seed: number;
}

interface Notice {
  target: string;
  text: string;
  age: number;
}

type FloatAmounts = Partial<Pick<FloatText, 'damage' | 'absorbed' | 'barrier' | 'heal'>>;

export class BattleScene implements Scene {
  private battle!: Battle;
  private anims = new Map<string, Anim>();
  private floats: FloatText[] = [];
  private vfx: ActiveVfx[] = [];
  private notices: Notice[] = [];
  private brokenThisBattle = new Map<string, Set<EquipSlot>>();
  private vfxSeed = 0;
  private endedFor = 0;
  private sprites = new Map<string, SpriteSet>();
  private icons = {
    taunt: spriteCanvas(TAUNT_ICON, 'idle'),
    shapeshift: spriteCanvas(SHAPESHIFT_ICON, 'idle'),
    haste: spriteCanvas(HASTE_ICON, 'idle'),
    slow: spriteCanvas(SLOW_ICON, 'idle'),
    dot: spriteCanvas(DOT_ICON, 'idle'),
    regen: spriteCanvas(REGEN_ICON, 'idle'),
    buff: spriteCanvas(BUFF_ICON, 'idle'),
    debuff: spriteCanvas(DEBUFF_ICON, 'idle'),
  };

  // The debug screen passes its own encounter, and `done` to return to it after the fight.
  constructor(
    private game: GameContext,
    private encounter?: (CombatantDef | null)[],
    private done?: () => Scene,
  ) {
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
    // Wounded/blessed effects from events apply to this fight only.
    const party = this.game.state.run ? takeNextFight(this.game.state) : undefined;
    const enemies = this.encounter ?? currentEncounter(this.game.state);
    this.battle = new Battle(this.game.state.party, enemies, Math.random, { creatures: CREATURES, party });
    this.anims.clear();
    this.floats = [];
    this.vfx = [];
    this.notices = [];
    this.brokenThisBattle.clear();
    this.endedFor = 0;
  }

  update(dt: number): void {
    const clicks = this.game.input.consumeClicks();
    if (this.battle.result && this.endedFor >= RESULT_DELAY && clicks.length > 0) {
      if (this.done) return this.game.scenes.switchTo(this.done());
      if (!this.game.state.run) return this.game.scenes.switchTo(new PreBattleScene(this.game));
      if (this.battle.result === 'victory') return winNode(this.game, this.battle.gold);
      loseRun(this.game, [...new Set(this.battle.combatants.filter((c) => c.side === 'enemy').map((c) => c.def.name.toUpperCase()))]);
      return;
    }

    for (const f of this.floats) {
      f.age += dt;
      f.pop = Math.max(0, f.pop - dt);
    }
    this.floats = this.floats.filter((f) => f.age < FLOAT_TIME);
    for (const v of this.vfx) v.age += dt;
    this.vfx = this.vfx.filter((v) => v.age < VFX[v.id].duration);
    for (const n of this.notices) n.age += dt;
    this.notices = this.notices.filter((n) => n.age < NOTICE_TIME);
    for (const event of this.battle.tick(dt)) this.handle(event);

    for (const anim of this.anims.values()) {
      anim.attack = Math.max(0, anim.attack - dt);
      anim.flash = Math.max(0, anim.flash - dt);
      anim.hidden = Math.max(0, anim.hidden - dt);
      anim.morph = Math.max(0, anim.morph - dt);
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
        const slotIndex = actor.slots.findIndex((s) => s.def.id === event.skill);
        anim.lastFired[slotIndex] = this.battle.elapsed;
        const skill = actor.slots[slotIndex].def;
        for (const target of event.targets) {
          if (skill.vfx) this.playVfx(skill.vfx, target);
          if (skill.effects.some((e) => e.kind === 'chaos')) this.playVfx('chaos', target);
        }
        break;
      }
      case 'damage': {
        const stats = this.game.state.run?.stats;
        const hit = event.amount + event.absorbed;
        if (stats && this.battle.get(event.target).side === 'party') stats.damageTaken += hit;
        else if (stats) stats.damageDone += hit;
        this.anim(event.target).flash = FLASH_TIME;
        this.float(event.target, { damage: event.amount, absorbed: event.absorbed });
        if (event.periodic) {
          const target = this.battle.get(event.target);
          this.playVfx(dotVfxId(event.element, event.amount + event.absorbed, target.maxHp), event.target);
        }
        break;
      }
      case 'status':
        if (STATUS_VFX.has(event.status)) this.playVfx(event.status, event.target);
        if (event.status === 'transform' && !this.anim(event.target).critter) this.anim(event.target).morph = VFX.transform.duration;
        break;
      case 'summon':
        this.playVfx('summon', event.unit);
        this.anim(event.unit).hidden = VFX.summon.duration;
        break;
      case 'barrier':
        this.float(event.target, { barrier: event.amount });
        break;
      case 'heal':
        if (event.amount > 0) this.float(event.target, { heal: event.amount });
        break;
      case 'equipmentBroken': {
        const state = this.game.state;
        const member = state.party[this.battle.get(event.target).position];
        const item = member.equipment[event.slot];
        const equipment = { ...member.equipment };
        delete equipment[event.slot];
        state.party = state.party.map((m) => (m === member ? { ...m, equipment } : m));
        if (!this.brokenThisBattle.has(event.target)) this.brokenThisBattle.set(event.target, new Set());
        this.brokenThisBattle.get(event.target)!.add(event.slot);
        this.notices.push({ target: event.target, text: `${item?.name ?? event.slot} BROKE`, age: 0 });
        if (item && state.run) state.run.broken.push(itemRef(item));
        break;
      }
      case 'buff':
      case 'death':
      case 'end':
        break;
    }
  }

  // Created on first use, since summons join mid-battle.
  private playVfx(id: string, target: string): void {
    this.vfx.push({ id, target, age: 0, seed: ++this.vfxSeed });
  }

  private anim(uid: string): Anim {
    let a = this.anims.get(uid);
    if (!a) {
      a = { attack: 0, flash: 0, death: 0, lastFired: this.battle.get(uid).slots.map(() => -Infinity), hidden: 0, morph: 0, critter: false };
      this.anims.set(uid, a);
    }
    return a;
  }

  private float(target: string, add: FloatAmounts): void {
    const existing = this.floats.find((f) => f.target === target && f.age < MERGE_WINDOW);
    if (existing) {
      existing.damage += add.damage ?? 0;
      existing.absorbed += add.absorbed ?? 0;
      existing.barrier += add.barrier ?? 0;
      existing.heal += add.heal ?? 0;
      existing.age = 0;
      existing.pop = POP_TIME;
      return;
    }
    this.floats.push({
      target,
      damage: add.damage ?? 0,
      absorbed: add.absorbed ?? 0,
      barrier: add.barrier ?? 0,
      heal: add.heal ?? 0,
      age: 0,
      pop: 0,
    });
  }

  render(ctx: CanvasRenderingContext2D): void {
    drawBackground(ctx);

    const party = this.battle.combatants.filter((c) => c.side === 'party' && !isSummon(c));
    party.forEach((c) => this.drawCard(ctx, c));

    for (const c of party) this.drawFamiliarGhost(ctx, c);
    for (const c of this.battle.combatants) this.drawCombatant(ctx, c);
    for (const v of this.vfx) this.drawVfx(ctx, v);
    for (const f of this.floats) this.drawFloat(ctx, f);
    for (const n of this.notices) this.drawNotice(ctx, n);

    const time = `TIME ${this.battle.elapsed.toFixed(1)}`;
    drawText(ctx, time, FIELD_CENTER_X - textWidth(time) / 2, 16, PALETTE.sand);

    if (this.battle.result && this.endedFor >= RESULT_DELAY) {
      this.drawResult(ctx, this.battle.result === 'victory');
      return;
    }
    const pointer = this.game.input.pointer;
    for (const c of party) {
      const slot = hoveredSlot(pointer, cardIconOrigin(c));
      if (slot) drawEquipmentTooltip(ctx, slot, c.equipment[slot], pointer);
    }
  }

  private spriteSet(c: Combatant): SpriteSet {
    const anim = this.anim(c.uid);
    anim.critter = c.transformed > 0 && anim.morph <= 0;
    const id = anim.critter ? 'critter' : c.def.id;
    const set = this.sprites.get(id);
    if (!set) throw new Error(`No sprite for ${c.def.id}`);
    return set;
  }

  private drawCombatant(ctx: CanvasRenderingContext2D, c: Combatant): void {
    const anim = this.anim(c.uid);
    const alpha = c.hp > 0 ? 1 : Math.max(0, 1 - anim.death / DEATH_FADE);
    if (alpha <= 0 || anim.hidden > 0) return;

    const set = this.spriteSet(c);
    const { x, y } = slotPosition(c);
    const attacking = anim.attack > 0;
    const progress = attacking ? 1 - anim.attack / ATTACK_TIME : 0;
    const lunge = Math.round(Math.sin(progress * Math.PI) * LUNGE_PX) * (c.side === 'party' ? 1 : -1);
    const img = anim.flash > 0 ? set.flash : attacking ? set.attack : set.idle;

    ctx.globalAlpha = alpha;
    ctx.drawImage(img, x + lunge, y);
    ctx.globalAlpha = 1;
    if (c.hp <= 0) return;
    this.statusIcons(c).forEach((icon, i) => ctx.drawImage(icon, x - 9, y + 23 - i * 9));
    if (c.side === 'party' && !isSummon(c)) {
      this.drawMeter(ctx, c, x, y + 34);
      return;
    }

    drawBar(ctx, x, y + 34, 32, 3, c.hp / c.maxHp, PALETTE.green);
    if (isSummon(c)) return;
    const slot = c.slots[0];
    if (slot) drawBar(ctx, x, y + 38, 32, 2, slot.timer / slot.def.cooldown, PALETTE.gold);
  }

  // Most important first; only the first few fit beside the sprite.
  private statusIcons(c: Combatant): HTMLCanvasElement[] {
    const speed = c.speed.reduce((f, s) => f * s.value, 1);
    const shown = [
      c.taunting > 0 && this.icons.taunt,
      c.shapeshift && this.icons.shapeshift,
      speed > 1 && this.icons.haste,
      speed < 1 && this.icons.slow,
      c.dots.length > 0 && this.icons.dot,
      c.regens.length > 0 && this.icons.regen,
      c.buffs.some((b) => b.amount > 0) && this.icons.buff,
      c.buffs.some((b) => b.amount < 0) && this.icons.debuff,
    ];
    return shown.filter((icon): icon is HTMLCanvasElement => !!icon).slice(0, STATUS_ICONS_MAX);
  }

  // Class mechanic under the sprite: rage and chi bars, soul pips, or the familiar's summoning progress.
  private drawMeter(ctx: CanvasRenderingContext2D, c: Combatant, x: number, y: number): void {
    if (c.def.familiar && c.channel > 0) {
      drawBar(ctx, x, y, 32, 3, 1 - c.channel / MECHANIC.channelSeconds, PALETTE.magenta);
      return;
    }
    const blink = Math.floor(this.battle.elapsed / FRENZY_BLINK) % 2 === 0;
    switch (c.def.mechanic) {
      case 'rage':
        if (c.burst > 0) {
          drawBar(ctx, x, y, 32, 3, c.burst / MECHANIC.frenzySeconds, blink ? PALETTE.hotRed : PALETTE.white);
          return;
        }
        drawBar(ctx, x, y, 32, 3, c.meter / MECHANIC.rageMax, PALETTE.red);
        return;
      case 'chi':
        if (c.burst > 0) {
          drawBar(ctx, x, y, 32, 3, c.burst / MECHANIC.burstSeconds, blink ? PALETTE.gold : PALETTE.white);
          return;
        }
        drawBar(ctx, x, y, 32, 3, c.meter / MECHANIC.chiMax, PALETTE.cyan);
        ctx.fillStyle = PALETTE.white;
        ctx.fillRect(x + Math.round(32 * MECHANIC.chiFilling), y - 1, 1, 5);
        return;
      case 'souls':
        for (let i = 0; i < MECHANIC.soulsMax; i++) {
          ctx.fillStyle = PALETTE.black;
          ctx.fillRect(x + i * 7 - 1, y - 1, 6, 5);
          ctx.fillStyle = i < c.meter ? PALETTE.magenta : PALETTE.night;
          ctx.fillRect(x + i * 7, y, 4, 3);
        }
        return;
    }
  }

  // While the familiar is being summoned, a faint preview stands where it will appear.
  private drawFamiliarGhost(ctx: CanvasRenderingContext2D, c: Combatant): void {
    if (!c.def.familiar || c.channel <= 0 || c.hp <= 0) return;
    const set = this.sprites.get(c.def.familiar);
    if (!set) return;
    ctx.globalAlpha = FAMILIAR_GHOST_ALPHA;
    ctx.drawImage(set.idle, SUMMON_X[0], ROW_TOPS[c.position]);
    ctx.globalAlpha = 1;
  }

  private visualCenter(c: Combatant): { cx: number; cy: number } {
    const { x, y } = slotPosition(c);
    return { cx: x + 16, cy: y + Math.round((this.spriteSet(c).topRow + 31) / 2) };
  }

  private drawVfx(ctx: CanvasRenderingContext2D, v: ActiveVfx): void {
    const def = VFX[v.id];
    const { cx, cy } = this.visualCenter(this.battle.get(v.target));
    def.draw(ctx, v.age / def.duration, cx, cy, v.seed);
  }

  private drawNotice(ctx: CanvasRenderingContext2D, n: Notice): void {
    const target = this.battle.get(n.target);
    const { x, y } = slotPosition(target);
    const top = y + this.spriteSet(target).topRow - 20 - n.age * NOTICE_RISE_PER_SEC;
    drawText(ctx, n.text, x + 16 - textWidth(n.text) / 2, top, PALETTE.hotRed);
  }

  private drawFloat(ctx: CanvasRenderingContext2D, f: FloatText): void {
    const segments: { text: string; color: string }[] = [];
    if (f.damage > 0) segments.push({ text: `-${f.damage}`, color: PALETTE.red });
    if (f.absorbed > 0) segments.push({ text: `(${f.absorbed})`, color: PALETTE.cyan });
    if (f.barrier > 0) segments.push({ text: `+${f.barrier}`, color: PALETTE.cyan });
    if (f.heal > 0) segments.push({ text: `+${f.heal}`, color: PALETTE.green });
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
    const hp = `${c.hp}/${c.maxHp}`;
    drawText(ctx, hp, inner + innerW - textWidth(hp), cy + 5, alive ? PALETTE.green : PALETTE.slate);
    const icons = cardIconOrigin(c);
    drawEquipmentIcons(ctx, c.equipment, icons.x, icons.y, !alive, this.brokenThisBattle.get(c.uid));
    const hpW = icons.x - inner - 4;
    drawBar(ctx, inner, cy + 15, hpW, 4, c.hp / c.maxHp, PALETTE.green);
    if (c.barrier) drawBar(ctx, inner, cy + 20, hpW, 1, c.barrier.amount / c.maxHp, PALETTE.cyan, false);

    const anim = this.anim(c.uid);
    for (let i = 0; i < SKILL_SLOTS; i++) {
      const rowY = cy + 24 + i * 11;
      const slot = c.slots[i];
      if (!slot) {
        drawText(ctx, '- EMPTY -', inner, rowY, PALETTE.night, null);
        continue;
      }
      const nameColor = !alive ? PALETTE.slate : slot.def.category === 'spell' ? PALETTE.cyan : PALETTE.lightGray;
      drawText(ctx, slot.def.name, inner, rowY, nameColor);
      const justFired = !this.battle.result && this.battle.elapsed - anim.lastFired[i] < FIRE_HIGHLIGHT;
      const fill = !alive ? 0 : justFired ? 1 : slot.timer / slot.def.cooldown;
      drawBar(ctx, inner, rowY + 8, innerW, 2, fill, justFired ? PALETTE.white : PALETTE.gold, false);
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
    const hint = 'CLICK TO CONTINUE';
    drawText(ctx, hint, (NATIVE_WIDTH - textWidth(hint)) / 2, by + 32, PALETTE.gray);
  }
}

// Party: one per row, aligned with its sidebar card, with summons in a column in front of them.
// Enemies: 3x3 grid, column 0 is the front line.
function slotPosition(c: Combatant): { x: number; y: number } {
  const { row, column } = gridCell(c);
  if (c.side === 'party') return { x: SUMMON_X[column] ?? PARTY_X, y: ROW_TOPS[row] };
  return { x: ENEMY_COLUMN_X[column], y: ROW_TOPS[row] };
}

function cardIconOrigin(c: Combatant): { x: number; y: number } {
  return { x: CARD_X + CARD_W - 5 - (EQUIP_SLOTS.length * ICON_STEP - 1), y: ROW_TOPS[c.position] + CARD_OFFSET_Y + 13 };
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
