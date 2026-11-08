import { PALETTE } from '../art/palette';
import type { EquipmentDef, PartyMember, SkillDef } from '../combat/types';
import { SKILLS_BY_ID } from '../content/skills';
import { NATIVE_HEIGHT, NATIVE_WIDTH } from '../engine/renderer';
import { equipItemBlock, equippedSkills, skillAccessBlock, TIMED_SLOTS } from '../game/loadout';
import { wrap, type Line } from './describeLines';
import { drawText, textWidth } from './font';
import { STAT_LABEL } from './partyCard';
import { drawPanel, RARITY_COLOR, type Rect } from './widgets';

// A hover popup beside a skill or item card: one column per hero who could use it, showing what they have now.

export type ComparePick = { kind: 'skill'; skill: SkillDef } | { kind: 'item'; item: EquipmentDef };

const COLUMN_CHARS = 16;
const COLUMN_GAP = 10;
const ROW = 10;
const PAD = 5;
const SCREEN: Rect = { x: 0, y: 0, w: NATIVE_WIDTH, h: NATIVE_HEIGHT };

export function compareColumns(party: PartyMember[], pick: ComparePick): Line[][] {
  const users = party.filter((m) => (pick.kind === 'skill' ? !skillAccessBlock(m, pick.skill) : !equipItemBlock(m, pick.item)));
  if (users.length === 0) return [[{ text: 'NO ONE CAN USE IT', color: PALETTE.slate }]];
  return users.map((m) => [
    { text: m.def.name.toUpperCase(), color: PALETTE.cyan },
    ...(pick.kind === 'skill' ? skillColumn(m, pick.skill) : itemColumn(m, pick.item)),
  ]);
}

// What the hero wears in that slot, then each stat that would change if they swapped.
function itemColumn(m: PartyMember, item: EquipmentDef): Line[] {
  const current = m.equipment[item.slot];
  if (current?.id === item.id) return [{ text: 'HAS IT', color: PALETTE.slate }];
  const lines: Line[] = [current ? { text: current.name.toUpperCase(), color: RARITY_COLOR[current.rarity] } : { text: 'EMPTY', color: PALETTE.slate }];
  for (const [k, label] of STAT_LABEL) {
    const d = (item.stats[k] ?? 0) - (current?.stats[k] ?? 0);
    if (d !== 0) lines.push({ text: `${label} ${d > 0 ? '+' : ''}${d}`, color: d > 0 ? PALETTE.green : PALETTE.red });
  }
  if (lines.length === 1) lines.push({ text: 'NO STAT CHANGE', color: PALETTE.slate });
  if (current?.enchantment) lines.push({ text: 'LOSES ENCHANTMENT', color: PALETTE.orange });
  return lines;
}

// The slots the skill would go into (the timed skills, or the trigger), then its synergy and prerequisite.
function skillColumn(m: PartyMember, skill: SkillDef): Line[] {
  const equipped = equippedSkills(m);
  if (equipped.some((s) => s.id === skill.id)) return [{ text: 'HAS IT', color: PALETTE.slate }];
  const named = (s: SkillDef | null | undefined): Line =>
    s ? { text: s.name.toUpperCase(), color: RARITY_COLOR[s.rarity] } : { text: 'FREE', color: PALETTE.green };
  const lines = skill.trigger
    ? [{ text: 'TRIGGER:', color: PALETTE.slate }, named(m.trigger)]
    : Array.from({ length: TIMED_SLOTS }, (_, i) => named(m.skills[i]));
  const has = (id: string) => equipped.some((s) => s.id === id);
  if (skill.prerequisite) {
    const name = SKILLS_BY_ID[skill.prerequisite].name.toUpperCase();
    lines.push(has(skill.prerequisite) ? { text: `HAS ${name}`, color: PALETTE.green } : { text: `NEEDS ${name}`, color: PALETTE.red });
  }
  if (skill.synergy && has(skill.synergy.with)) {
    lines.push({ text: `+${Math.round(skill.synergy.bonus * 100)}% FROM ${SKILLS_BY_ID[skill.synergy.with].name.toUpperCase()}`, color: PALETTE.magenta });
  }
  for (const s of equipped.filter((s) => s.synergy?.with === skill.id)) {
    lines.push({ text: `BOOSTS ${s.name.toUpperCase()} +${Math.round(s.synergy!.bonus * 100)}%`, color: PALETTE.magenta });
  }
  return lines;
}

// Below the card if it fits inside `area`, else above it, else as low as it can go.
export function drawCompare(ctx: CanvasRenderingContext2D, columns: Line[][], card: Rect, area: Rect = SCREEN): void {
  const wrapped = columns.map((col) => col.flatMap((l) => wrap(l.text, COLUMN_CHARS).map((text) => ({ text, color: l.color }))));
  const widths = wrapped.map((col) => Math.max(...col.map((l) => textWidth(l.text))));
  const w = widths.reduce((a, b) => a + b, 0) + COLUMN_GAP * (widths.length - 1) + 2 * PAD;
  const h = Math.max(...wrapped.map((col) => col.length)) * ROW + 2 * PAD - 2;
  const bottom = area.y + area.h;
  const x = Math.max(area.x, Math.min(card.x, area.x + area.w - w));
  const below = card.y + card.h + 2;
  const above = card.y - 2 - h;
  const y = below + h <= bottom ? below : above >= area.y ? above : bottom - h;
  drawPanel(ctx, { x, y, w, h }, PALETTE.gold);
  let colX = x + PAD;
  wrapped.forEach((col, i) => {
    col.forEach((l, row) => drawText(ctx, l.text, colX, y + PAD + row * ROW, l.color));
    colX += widths[i] + COLUMN_GAP;
  });
}
