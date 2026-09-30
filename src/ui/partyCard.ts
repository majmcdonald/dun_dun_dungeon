import { EQUIP_ICONS } from '../art/icons';
import { PALETTE } from '../art/palette';
import { spriteCanvas } from '../art/sprite';
import { SPRITES } from '../art/sprites';
import { EQUIP_SLOTS, type Equipment, type EquipmentDef, type EquipSlot, type PartyMember, type Stats } from '../combat/types';
import { NATIVE_HEIGHT, NATIVE_WIDTH } from '../engine/renderer';
import { describeEnchantment } from '../game/describe';
import { drawText, textWidth } from './font';
import { drawFrame, drawPanel, inside, type Rect } from './widgets';

export const ICON_STEP = 9;
export const PARTY_CARD_W = 148;
export const PARTY_CARD_H = 114;
const SKILL_SLOTS = 4;

let iconCache: Record<EquipSlot, HTMLCanvasElement> | null = null;
const spriteCache = new Map<string, HTMLCanvasElement>();

export function equipIcon(slot: EquipSlot): HTMLCanvasElement {
  return icons()[slot];
}

function icons(): Record<EquipSlot, HTMLCanvasElement> {
  iconCache ??= Object.fromEntries(EQUIP_SLOTS.map((s) => [s, spriteCanvas(EQUIP_ICONS[s], 'idle')])) as Record<
    EquipSlot,
    HTMLCanvasElement
  >;
  return iconCache;
}

function idleSprite(id: string): HTMLCanvasElement {
  let canvas = spriteCache.get(id);
  if (!canvas) {
    canvas = spriteCanvas(SPRITES[id], 'idle');
    spriteCache.set(id, canvas);
  }
  return canvas;
}

export function drawEquipmentIcons(
  ctx: CanvasRenderingContext2D,
  equipment: Equipment,
  x: number,
  y: number,
  dim = false,
  broken?: Set<EquipSlot>,
): void {
  EQUIP_SLOTS.forEach((slot, i) => {
    const ix = x + i * ICON_STEP;
    if (equipment[slot]) {
      ctx.globalAlpha = dim ? 0.4 : 1;
      ctx.drawImage(icons()[slot], ix, y);
      ctx.globalAlpha = 1;
      return;
    }
    drawFrame(ctx, { x: ix, y, w: 8, h: 8 }, PALETTE.night);
    if (!broken?.has(slot)) return;
    ctx.fillStyle = PALETTE.hotRed;
    for (let d = 1; d < 7; d++) {
      ctx.fillRect(ix + d, y + d, 1, 1);
      ctx.fillRect(ix + 7 - d, y + d, 1, 1);
    }
  });
}

// Full-size card for the pre-battle and party screens: position, portrait, gear, and ability loadout.
export function drawPartyCard(
  ctx: CanvasRenderingContext2D,
  member: PartyMember,
  position: number,
  rect: Rect,
  border: string,
): void {
  drawPanel(ctx, rect, border);
  const { x, y, w } = rect;

  drawText(ctx, `${position + 1}`, x + 6, y + 6, PALETTE.gold);
  drawText(ctx, member.def.name, x + 16, y + 6, PALETTE.white);

  ctx.drawImage(idleSprite(member.def.id), x + (w - 32) / 2, y + 14);

  const maxHp = member.def.stats.hp + Object.values(member.equipment).reduce((sum, e) => sum + (e?.stats.hp ?? 0), 0);
  drawText(ctx, `HP ${maxHp}`, x + 6, y + 50, PALETTE.green);
  const icons = cardIconOrigin(rect);
  drawEquipmentIcons(ctx, member.equipment, icons.x, icons.y);

  ctx.fillStyle = PALETTE.darkSlate;
  ctx.fillRect(x + 6, y + 62, w - 12, 1);

  for (let i = 0; i < SKILL_SLOTS; i++) {
    const rowY = y + 68 + i * 11;
    const skill = member.skills[i];
    if (!skill) {
      drawText(ctx, '- EMPTY -', x + 6, rowY, PALETTE.night, null);
      continue;
    }
    drawText(ctx, skill.name, x + 6, rowY, skill.category === 'spell' ? PALETTE.cyan : PALETTE.lightGray);
    const cd = `${skill.cooldown.toFixed(1)}S`;
    drawText(ctx, cd, x + w - 6 - textWidth(cd), rowY, PALETTE.slate);
  }
}


const CARD_GAP = 8;

export function partyCardRect(position: number, top: number): Rect {
  const left = (NATIVE_WIDTH - (PARTY_CARD_W * 3 + CARD_GAP * 2)) / 2;
  return { x: left + position * (PARTY_CARD_W + CARD_GAP), y: top, w: PARTY_CARD_W, h: PARTY_CARD_H };
}

export function cardIconOrigin(rect: Rect): { x: number; y: number } {
  return { x: rect.x + rect.w - 6 - (EQUIP_SLOTS.length * ICON_STEP - 1), y: rect.y + 49 };
}

export function hoveredSlot(pointer: { x: number; y: number }, origin: { x: number; y: number }): EquipSlot | null {
  return EQUIP_SLOTS.find((_, i) => inside(pointer, { x: origin.x + i * ICON_STEP, y: origin.y, w: 8, h: 8 })) ?? null;
}

export const SLOT_LABEL: Record<EquipSlot, string> = {
  helmet: 'HELMET',
  armor: 'ARMOR',
  boots: 'BOOTS',
  weapon: 'WEAPON',
  jewelry: 'JEWELRY',
};

export const STAT_LABEL: [keyof Stats, string][] = [
  ['hp', 'HP'],
  ['attack', 'ATK'],
  ['magic', 'MAG'],
  ['defense', 'DEF'],
  ['resistance', 'RES'],
];

function tooltipLines(slot: EquipSlot, item: EquipmentDef | undefined): { text: string; color: string }[] {
  if (!item) return [{ text: `${SLOT_LABEL[slot]}: EMPTY`, color: PALETTE.slate }];
  const lines: { text: string; color: string }[] = [{ text: `${SLOT_LABEL[slot]}: ${item.name}`, color: PALETTE.white }];
  const bonuses = STAT_LABEL.filter(([k]) => item.stats[k]).map(([k, label]) => `+${item.stats[k]} ${label}`);
  if (bonuses.length > 0) lines.push({ text: bonuses.join('  '), color: PALETTE.green });
  if (item.enchantment) lines.push({ text: describeEnchantment(item.enchantment), color: PALETTE.orange });
  return lines;
}

// Drawn last so it sits above everything; flips above the anchor or shifts left to stay on screen.
export function drawEquipmentTooltip(
  ctx: CanvasRenderingContext2D,
  slot: EquipSlot,
  item: EquipmentDef | undefined,
  anchor: { x: number; y: number },
): void {
  const lines = tooltipLines(slot, item);
  const w = Math.max(...lines.map((l) => textWidth(l.text))) + 10;
  const h = lines.length * 10 + 6;
  let x = anchor.x;
  let y = anchor.y + 11;
  if (x + w > NATIVE_WIDTH - 2) x = NATIVE_WIDTH - 2 - w;
  if (y + h > NATIVE_HEIGHT - 2) y = anchor.y - 3 - h;
  drawPanel(ctx, { x, y, w, h }, PALETTE.gold);
  lines.forEach((l, i) => drawText(ctx, l.text, x + 5, y + 4 + i * 10, l.color));
}
