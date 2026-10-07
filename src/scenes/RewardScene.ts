import { PALETTE } from '../art/palette';
import type { EquipmentDef, PartyMember, SkillDef } from '../combat/types';
import { NATIVE_WIDTH } from '../engine/renderer';
import type { GameContext, Scene } from '../engine/scene';
import { equipItemBlock, equippedSkills, skillAccessBlock } from '../game/loadout';
import { ITEMS_BY_ID } from '../content/items';
import { SKILLS_BY_ID } from '../content/skills';
import { choosePicks } from '../run/flow';
import { pickHolder, type LastReward } from '../run/run';
import { drawBackground } from '../ui/background';
import { itemLines, skillLines, wrap, type Line } from '../ui/describeLines';
import { drawText, textWidth } from '../ui/font';
import { drawItemIcon } from '../ui/partyCard';
import { drawButton, drawFrame, drawPanel, inside, type Button, type Rect } from '../ui/widgets';

const CARD_W = 148;
const CARD_GAP = 8;
const CARDS_X = 10;
const SKILL_TOP = 56;
const SKILL_H = 100;
const ITEM_TOP = 172;
const ITEM_H = 88;
const LINE_H = 9;
const DIALOG: Rect = { x: 100, y: 96, w: 280, h: 74 };
const CHANGE: Button = { x: 150, y: 142, w: 84, h: 18, label: 'CHANGE' };
const CANCEL: Button = { x: 246, y: 142, w: 84, h: 18, label: 'CANCEL' };
const CONTINUE: Button = { x: CARDS_X + 2 * (CARD_W + CARD_GAP), y: 222, w: CARD_W, h: 20, label: 'CONTINUE' };

// After a won fight or a treasure: gold is already banked; optionally take 1 of 3 skills and 1 of 2 items.
// Reopening it (BACK from the party screen, or the last node on the map) shows the current picks.
export class RewardScene implements Scene {
  private reward: LastReward;
  private skills: SkillDef[];
  private items: EquipmentDef[];
  private skill: SkillDef | null;
  private item: EquipmentDef | null;
  // Rows whose equipped pick the player already agreed to give up.
  private released = { skill: false, item: false };
  private confirm: { kind: 'skill' | 'item'; next: SkillDef | EquipmentDef | null; lines: string[] } | null = null;

  constructor(private game: GameContext) {
    this.reward = game.state.run!.lastReward!;
    this.skills = this.reward.skills.map((id) => SKILLS_BY_ID[id]);
    this.items = this.reward.items.map((id) => ITEMS_BY_ID[id]);
    this.skill = this.skills.find((s) => s.id === this.reward.skill) ?? null;
    this.item = this.items.find((i) => i.id === this.reward.item) ?? null;
  }

  enter(): void {
    this.game.input.consumeClicks();
  }

  update(): void {
    for (const click of this.game.input.consumeClicks()) {
      if (this.confirm) {
        if (inside(click, CHANGE)) this.apply(this.confirm.kind, this.confirm.next);
        if (inside(click, CHANGE) || inside(click, CANCEL)) this.confirm = null;
        continue;
      }
      if (inside(click, CONTINUE)) return choosePicks(this.game, this.skill?.id ?? null, this.item?.id ?? null);
      const skill = this.skills.find((_, i) => inside(click, skillRect(i)));
      if (skill) this.choose('skill', this.skill === skill ? null : skill);
      const item = this.items.find((_, i) => inside(click, itemRect(i)));
      if (item) this.choose('item', this.item === item ? null : item);
    }
  }

  // Moving off a pick that a character has equipped asks first, since it will be unequipped.
  private choose(kind: 'skill' | 'item', next: SkillDef | EquipmentDef | null): void {
    const saved = kind === 'skill' ? this.reward.skill : this.reward.item;
    const holder = saved && !this.released[kind] && next?.id !== saved ? pickHolder(this.game.state, kind, saved) : null;
    if (!holder) return this.apply(kind, next);
    const name = (kind === 'skill' ? SKILLS_BY_ID[saved!].name : ITEMS_BY_ID[saved!].name).toUpperCase();
    this.confirm = {
      kind,
      next,
      lines: [`${holder.def.name.toUpperCase()} HAS ${name} EQUIPPED.`, 'CHANGING THIS PICK WILL UNEQUIP IT.'],
    };
  }

  private apply(kind: 'skill' | 'item', next: SkillDef | EquipmentDef | null): void {
    const saved = kind === 'skill' ? this.reward.skill : this.reward.item;
    if (next?.id !== saved) this.released[kind] = true;
    if (kind === 'skill') this.skill = next as SkillDef | null;
    else this.item = next as EquipmentDef | null;
  }

  render(ctx: CanvasRenderingContext2D): void {
    drawBackground(ctx, this.game.state.run?.level ?? 0);
    const treasure = this.reward.type === 'treasure';
    const title = treasure ? 'TREASURE' : 'VICTORY';
    drawText(ctx, title, (NATIVE_WIDTH - textWidth(title)) / 2, 8, PALETTE.gold);
    const parts: [string, string][] = [
      [`+${this.reward.gold} GOLD`, PALETTE.gold],
      [`   TOTAL ${this.game.state.run!.gold}`, PALETTE.yellow],
      [treasure ? '' : '   PARTY FULLY HEALED', PALETTE.green],
    ];
    let subX = (NATIVE_WIDTH - textWidth(parts.map(([t]) => t).join(''))) / 2;
    for (const [text, color] of parts) {
      drawText(ctx, text, subX, 23, color);
      subX += textWidth(text) + (text ? 1 : 0);
    }

    const pointer = this.game.input.pointer;
    const party = this.game.state.party;
    drawText(ctx, 'CHOOSE A SKILL', CARDS_X, SKILL_TOP - 11, PALETTE.sand);
    this.skills.forEach((s, i) => {
      const lines = [...skillLines(s), { text: `FOR: ${users(party, (m) => !skillAccessBlock(m, s))}`, color: PALETTE.cyan }, ...this.equippedNote('skill', s.id), ...this.ownedNote('skill', s.id)];
      drawCard(ctx, skillRect(i), lines, this.skill === s, inside(pointer, skillRect(i)));
    });

    drawText(ctx, 'CHOOSE AN ITEM', CARDS_X, ITEM_TOP - 11, PALETTE.sand);
    this.items.forEach((item, i) => {
      const r = itemRect(i);
      const lines = [
        ...itemLines(item).filter((l) => !l.text.startsWith('REQUIRES')),
        { text: `FOR: ${users(party, (m) => !equipItemBlock(m, item))}`, color: PALETTE.cyan },
        ...this.equippedNote('item', item.id),
        ...this.ownedNote('item', item.id),
      ];
      drawCard(ctx, r, lines, this.item === item, inside(pointer, r), 12);
      drawItemIcon(ctx, item, r.x + 6, r.y + 5);
    });

    const hint = ['CLICK A CARD TO TAKE IT.', 'LEAVE A ROW EMPTY', 'TO SKIP IT.'];
    hint.forEach((h, i) => drawText(ctx, h, CONTINUE.x, ITEM_TOP + 4 + i * 11, PALETTE.lightGray));
    drawButton(ctx, CONTINUE, inside(pointer, CONTINUE));

    if (!this.confirm) return;
    drawPanel(ctx, DIALOG, PALETTE.gold);
    this.confirm.lines.forEach((line, i) => drawText(ctx, line, (NATIVE_WIDTH - textWidth(line)) / 2, DIALOG.y + 12 + i * 12, PALETTE.white));
    drawButton(ctx, CHANGE, inside(pointer, CHANGE));
    drawButton(ctx, CANCEL, inside(pointer, CANCEL));
  }

  // Warns about copies the party already has, other than the one this reward gave: in the inventory, or on whom.
  private ownedNote(kind: 'skill' | 'item', id: string): Line[] {
    const state = this.game.state;
    const inInventory = (kind === 'skill' ? state.inventory.skills : state.inventory.items).filter((x) => x.id === id).length;
    let holders = state.party.filter((m) =>
      kind === 'skill' ? equippedSkills(m).some((s) => s.id === id) : Object.values(m.equipment).some((i) => i?.id === id),
    );
    let spare = inInventory;
    if (id === (kind === 'skill' ? this.reward.skill : this.reward.item)) {
      const holder = pickHolder(state, kind, id);
      if (holder) holders = holders.filter((m) => m !== holder);
      else spare -= 1;
    }
    if (holders.length === 0 && spare <= 0) return [];
    const where = [
      holders.length > 0 && `EQUIPPED ON ${holders.map((m) => m.def.name.toUpperCase()).join(', ')}`,
      spare > 0 && `${spare} IN INVENTORY`,
    ].filter(Boolean);
    return [{ text: `ALREADY OWNED: ${where.join(', ')}`, color: PALETTE.orange }];
  }

  // The current pick, if a character is wearing or using it.
  private equippedNote(kind: 'skill' | 'item', id: string): Line[] {
    const saved = kind === 'skill' ? this.reward.skill : this.reward.item;
    if (id !== saved) return [];
    const holder = pickHolder(this.game.state, kind, id);
    return holder ? [{ text: `EQUIPPED: ${holder.def.name.toUpperCase()}`, color: PALETTE.green }] : [];
  }
}

function skillRect(i: number): Rect {
  return { x: CARDS_X + i * (CARD_W + CARD_GAP), y: SKILL_TOP, w: CARD_W, h: SKILL_H };
}

function itemRect(i: number): Rect {
  return { x: CARDS_X + i * (CARD_W + CARD_GAP), y: ITEM_TOP, w: CARD_W, h: ITEM_H };
}

// Who in the party could use it: "ANYONE" when everyone can.
function users(party: PartyMember[], can: (m: PartyMember) => boolean): string {
  const names = party.filter(can).map((m) => m.def.name.toUpperCase());
  return names.length === party.length ? 'ANYONE' : names.join(', ');
}

// The first line starts after `indent` pixels (room for an icon); text stops at the card's bottom edge.
function drawCard(ctx: CanvasRenderingContext2D, r: Rect, lines: Line[], selected: boolean, hover: boolean, indent = 0): void {
  drawPanel(ctx, r, selected ? PALETTE.gold : hover ? PALETTE.lightGray : PALETTE.darkSlate);
  if (selected) drawFrame(ctx, { x: r.x + 1, y: r.y + 1, w: r.w - 2, h: r.h - 2 }, PALETTE.gold);
  const maxChars = Math.floor((r.w - 10) / 6);
  let y = r.y + 6;
  let first = true;
  for (const line of lines) {
    const width = first ? maxChars - Math.ceil(indent / 6) : maxChars;
    for (const text of wrap(line.text, width)) {
      if (y + LINE_H > r.y + r.h) return;
      drawText(ctx, text, r.x + 5 + (first ? indent : 0), y, line.color);
      y += LINE_H;
      first = false;
    }
  }
}
