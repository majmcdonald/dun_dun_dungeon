import { PALETTE } from '../art/palette';
import {
  EQUIP_SLOTS,
  RARITIES,
  type EquipmentDef,
  type EquipSlot,
  type PartyMember,
  type SkillDef,
  type Stats,
} from '../combat/types';
import { CLASSES_BY_ID } from '../content/classes';
import { NATIVE_WIDTH } from '../engine/renderer';
import type { GameContext, Scene } from '../engine/scene';
import {
  equipItemBlock,
  MAX_SKILLS,
  placeSkillBlock,
  removeSkillBlock,
  skillAccessBlock,
  skillInSlot,
  TIMED_SLOTS,
  TRIGGER_SLOT,
} from '../game/loadout';
import type { Inventory } from '../game/state';
import { drawBackground } from '../ui/background';
import { itemLines, skillLines, wrap } from '../ui/describeLines';
import { drawText, textWidth } from '../ui/font';
import { drawItemIcon, equipIcon, skillColor, SLOT_LABEL, slotCooldown, STAT_LABEL } from '../ui/partyCard';
import { drawButton, drawFrame, drawPanel, inside, RARITY_COLOR, type Button, type Rect } from '../ui/widgets';
import { PartyScene } from './PartyScene';

const LEFT: Rect = { x: 8, y: 40, w: 178, h: 196 };
const RIGHT: Rect = { x: 192, y: 40, w: 280, h: 196 };
const ROW_H = 12;
const GEAR_TOP = LEFT.y + 54;
const SKILLS_TOP = GEAR_TOP + EQUIP_SLOTS.length * ROW_H + 14;
const TOOLBAR_Y = RIGHT.y + 17;
const SEARCH: Rect = { x: RIGHT.x + 6, y: TOOLBAR_Y, w: 94, h: 11 };
const SEARCH_MAX = 14;
const LIST_TOP = RIGHT.y + 32;
const LIST_ROWS = 9;
const LIST_W = RIGHT.w - 16;
const DETAIL_TOP = LIST_TOP + LIST_ROWS * ROW_H + 6;
const PREV: Button = { x: 8, y: 242, w: 56, h: 20, label: 'PREV' };
const NEXT: Button = { x: 70, y: 242, w: 56, h: 20, label: 'NEXT' };
const UNEQUIP: Button = { x: 192, y: 242, w: 86, h: 20, label: 'UNEQUIP' };
const DONE: Button = { x: 392, y: 242, w: 80, h: 20, label: 'DONE' };
const MESSAGE_TIME = 2;
// Slot markers: 1 runs fast, 2 normal, 3 slow, 4 holds a trigger.
const SLOT_TAG = ['1', '2', '3', 'T'];
const SLOT_TAG_COLOR = [PALETTE.green, PALETTE.lightGray, PALETTE.red, PALETTE.orange];

type SortKey = 'cooldown' | 'name' | 'rarity';
const SKILL_SORTS: SortKey[] = ['cooldown', 'name', 'rarity'];
const GEAR_SORTS: SortKey[] = ['name', 'rarity'];
const SORT_LABEL: Record<SortKey, string> = { cooldown: 'COOLDOWN', name: 'NAME', rarity: 'RARITY' };

type Selection = { kind: 'gear'; slot: EquipSlot } | { kind: 'skill'; index: number };
type Entry = { kind: 'skill'; skill: SkillDef; block: string | null } | { kind: 'item'; item: EquipmentDef; block: string | null };

const ACCESS_ORDER = { class: 0, tag: 1, shared: 2 } as const;

// One character's gear and skills, swapped against the shared inventory. Reached from the party screen's EDIT buttons.
export class LoadoutScene implements Scene {
  private selection: Selection = { kind: 'skill', index: 0 };
  private scroll = 0;
  private message = '';
  private messageAge = 0;
  private search = '';
  // A timed skill being dragged to another of slots 1–3; `moved` once it has left its row.
  private drag: { from: number; grabX: number; grabY: number; startX: number; startY: number; moved: boolean } | null = null;
  private skillSort: SortKey = 'rarity';
  private gearSort: SortKey = 'rarity';

  // `done` builds the screen to return to (the party screen by default).
  constructor(
    private game: GameContext,
    private index: number,
    private done: () => Scene = () => new PartyScene(game),
  ) {}

  enter(): void {
    this.game.input.consumeClicks();
    this.game.input.consumePresses();
    this.game.input.consumeWheel();
    this.game.input.consumeTyped();
  }

  private get member(): PartyMember {
    return this.game.state.party[this.index];
  }

  private set member(m: PartyMember) {
    this.game.state.party = this.game.state.party.map((p, i) => (i === this.index ? m : p));
  }

  update(dt: number): void {
    const input = this.game.input;
    this.messageAge += dt;
    for (const key of input.consumeTyped()) this.type(key);
    const entries = this.entries();
    const maxScroll = Math.max(0, entries.length - LIST_ROWS);
    this.scroll = Math.min(maxScroll, Math.max(0, this.scroll + input.consumeWheel()));

    for (const press of input.consumePresses()) {
      const from = [...Array(TIMED_SLOTS).keys()].find((i) => inside(press, skillRow(i)) && this.member.skills[i]);
      if (from === undefined) continue;
      const r = skillRow(from);
      this.drag = { from, grabX: press.x - r.x, grabY: press.y - r.y, startX: press.x, startY: press.y, moved: false };
    }
    if (this.drag) {
      const p = input.pointer;
      if (Math.abs(p.x - this.drag.startX) + Math.abs(p.y - this.drag.startY) > 3) this.drag.moved = true;
      if (p.down) return;
      const drag = this.drag;
      this.drag = null;
      if (drag.moved) {
        input.consumeClicks();
        const to = [...Array(TIMED_SLOTS).keys()].find((i) => inside(p, skillRow(i)));
        if (to !== undefined && to !== drag.from) this.moveSkill(drag.from, to);
        return;
      }
    }

    for (const click of input.consumeClicks()) {
      if (inside(click, DONE)) return this.game.scenes.switchTo(this.done());
      if (inside(click, PREV)) this.switchMember(-1);
      else if (inside(click, NEXT)) this.switchMember(1);
      else if (inside(click, UNEQUIP)) this.unequip();
      else if (!this.clickSort(click)) this.clickSlotOrEntry(click, entries);
    }
  }

  // Typing anywhere on the screen edits the search; Escape clears it.
  private type(key: string): void {
    if (key === 'Backspace') this.search = this.search.slice(0, -1);
    else if (key === 'Escape') this.search = '';
    else if (/^[a-z0-9 ']$/i.test(key) && this.search.length < SEARCH_MAX) this.search += key.toUpperCase();
    else return;
    this.scroll = 0;
  }

  private sorts(): SortKey[] {
    return this.selection.kind === 'skill' ? SKILL_SORTS : GEAR_SORTS;
  }

  private activeSort(): SortKey {
    return this.selection.kind === 'skill' ? this.skillSort : this.gearSort;
  }

  private clickSort(click: { x: number; y: number }): boolean {
    const key = sortButtons(this.sorts()).find((b) => inside(click, b))?.key;
    if (!key) return false;
    if (this.selection.kind === 'skill') this.skillSort = key;
    else this.gearSort = key;
    this.scroll = 0;
    return true;
  }

  private switchMember(step: number): void {
    const count = this.game.state.party.length;
    this.index = (this.index + step + count) % count;
    this.scroll = 0;
  }

  private clickSlotOrEntry(click: { x: number; y: number }, entries: Entry[]): void {
    const slot = EQUIP_SLOTS.find((_, i) => inside(click, gearRow(i)));
    if (slot) return this.select({ kind: 'gear', slot });
    const skillIndex = [...Array(MAX_SKILLS).keys()].find((i) => inside(click, skillRow(i)));
    if (skillIndex !== undefined) return this.select({ kind: 'skill', index: skillIndex });

    const row = [...Array(LIST_ROWS).keys()].find((i) => inside(click, listRow(i)));
    const entry = row === undefined ? undefined : entries[this.scroll + row];
    if (entry) this.equip(entry);
  }

  private select(selection: Selection): void {
    this.selection = selection;
    this.scroll = 0;
    this.search = '';
  }

  private say(message: string): void {
    this.message = message;
    this.messageAge = 0;
  }

  private equip(entry: Entry): void {
    if (entry.block) return this.say(entry.block);
    const inventory = this.game.state.inventory;
    const m = this.member;
    if (entry.kind === 'item') {
      const old = m.equipment[entry.item.slot];
      inventory.items = take(inventory, inventory.items, entry.item);
      if (old) give(inventory, inventory.items, old);
      this.member = { ...m, equipment: { ...m.equipment, [entry.item.slot]: entry.item } };
      return;
    }
    inventory.skills = take(inventory, inventory.skills, entry.skill);
    if (this.selectedSkillIndex() === TRIGGER_SLOT) {
      if (m.trigger) give(inventory, inventory.skills, m.trigger);
      this.member = { ...m, trigger: entry.skill };
      return;
    }
    const index = Math.min(this.selectedSkillIndex(), m.skills.length);
    const skills = [...m.skills];
    const old = skills[index];
    skills[index] = entry.skill;
    if (old) give(inventory, inventory.skills, old);
    this.member = { ...m, skills };
  }

  private unequip(): void {
    const inventory = this.game.state.inventory;
    const m = this.member;
    if (this.selection.kind === 'gear') {
      const old = m.equipment[this.selection.slot];
      if (!old) return;
      const equipment = { ...m.equipment };
      delete equipment[this.selection.slot];
      give(inventory, inventory.items, old);
      this.member = { ...m, equipment };
      return;
    }
    const index = this.selection.index;
    const old = skillInSlot(m, index);
    if (!old) return;
    const block = removeSkillBlock(m, index);
    if (block) return this.say(block);
    give(inventory, inventory.skills, old);
    if (index === TRIGGER_SLOT) this.member = { ...m, trigger: null };
    else this.member = { ...m, skills: m.skills.filter((_, i) => i !== index) };
  }

  // Dropping onto a filled slot swaps the two; onto an empty slot, the skill moves to the last filled position.
  private moveSkill(from: number, to: number): void {
    const m = this.member;
    const skills = [...m.skills];
    if (to < skills.length) [skills[from], skills[to]] = [skills[to], skills[from]];
    else skills.push(...skills.splice(from, 1));
    this.member = { ...m, skills };
    if (this.selection.kind === 'skill' && this.selection.index === from) this.selection = { kind: 'skill', index: Math.min(to, skills.length - 1) };
  }

  // Timed skills stay packed in slots 1–3, so an empty timed slot means "the next free one".
  private targetSlot(index: number): number {
    return index === TRIGGER_SLOT ? TRIGGER_SLOT : Math.min(index, this.member.skills.length);
  }

  private selectedSkillIndex(): number {
    return this.selection.kind === 'skill' ? this.selection.index : 0;
  }

  // What the selected slot can take: usable entries first, blocked ones dimmed with their reason.
  private entries(): Entry[] {
    const m = this.member;
    const inventory = this.game.state.inventory;
    const selection = this.selection;
    const entries: Entry[] =
      selection.kind === 'gear'
        ? inventory.items
            .filter((item) => item.slot === selection.slot)
            .map((item): Entry => ({ kind: 'item', item, block: equipItemBlock(m, item) }))
        : inventory.skills
            // Slot 4 lists only triggers; slots 1–3 only timed skills.
            .filter((skill) => !skillAccessBlock(m, skill) && !!skill.trigger === (selection.index === TRIGGER_SLOT))
            .map((skill): Entry => ({ kind: 'skill', skill, block: placeSkillBlock(m, skill, this.targetSlot(selection.index)) }));
    const sort = this.activeSort();
    return entries
      .filter((e) => matches(e, this.search))
      .sort((a, b) => Number(!!a.block) - Number(!!b.block) || compareBy(sort, a, b) || entryName(a).localeCompare(entryName(b)));
  }

  render(ctx: CanvasRenderingContext2D): void {
    drawBackground(ctx);
    const m = this.member;
    const title = `LOADOUT: ${m.def.name.toUpperCase()}`;
    drawText(ctx, title, (NATIVE_WIDTH - textWidth(title)) / 2, 16, PALETTE.sand);

    const pointer = this.game.input.pointer;
    const entries = this.entries();
    const hoveredRow = [...Array(LIST_ROWS).keys()].find((i) => inside(pointer, listRow(i)));
    const hovered = hoveredRow === undefined ? undefined : entries[this.scroll + hoveredRow];

    this.drawCharacter(ctx, pointer, hovered?.kind === 'item' ? hovered.item : undefined);
    this.drawInventory(ctx, entries, hoveredRow);
    this.drawToolbar(ctx, pointer);
    this.drawDetail(ctx, hovered ?? this.selectedEntry());

    drawButton(ctx, PREV, inside(pointer, PREV));
    drawButton(ctx, NEXT, inside(pointer, NEXT));
    drawButton(ctx, UNEQUIP, inside(pointer, UNEQUIP));
    drawButton(ctx, DONE, inside(pointer, DONE));
    if (this.messageAge < MESSAGE_TIME) drawText(ctx, this.message, UNEQUIP.x + UNEQUIP.w + 8, UNEQUIP.y + 6, PALETTE.hotRed);
  }

  private selectedEntry(): Entry | undefined {
    const m = this.member;
    if (this.selection.kind === 'gear') {
      const item = m.equipment[this.selection.slot];
      return item && { kind: 'item', item, block: null };
    }
    const skill = skillInSlot(m, this.selection.index);
    return skill && { kind: 'skill', skill, block: null };
  }

  private drawToolbar(ctx: CanvasRenderingContext2D, pointer: { x: number; y: number }): void {
    drawPanel(ctx, SEARCH, this.search ? PALETTE.lightGray : PALETTE.darkSlate);
    drawText(ctx, this.search || 'TYPE TO SEARCH', SEARCH.x + 3, SEARCH.y + 2, this.search ? PALETTE.white : PALETTE.slate);
    if (this.search && Math.floor(performance.now() / 500) % 2 === 0) {
      ctx.fillStyle = PALETTE.white;
      ctx.fillRect(SEARCH.x + 3 + textWidth(this.search) + 1, SEARCH.y + 8, 5, 1);
    }

    const active = this.activeSort();
    for (const b of sortButtons(this.sorts())) {
      const on = b.key === active;
      drawPanel(ctx, b, on ? PALETTE.gold : inside(pointer, b) ? PALETTE.lightGray : PALETTE.darkSlate);
      drawText(ctx, b.label, b.x + 4, b.y + 2, on ? PALETTE.gold : PALETTE.gray);
    }
    const label = 'SORT';
    const first = sortButtons(this.sorts())[0];
    drawText(ctx, label, first.x - 4 - textWidth(label), first.y + 2, PALETTE.slate);
  }

  private drawCharacter(ctx: CanvasRenderingContext2D, pointer: { x: number; y: number }, preview?: EquipmentDef): void {
    const m = this.member;
    drawPanel(ctx, LEFT, PALETTE.darkSlate);
    const x = LEFT.x + 6;
    drawText(ctx, `${this.index + 1} ${m.def.name.toUpperCase()}`, x, LEFT.y + 6, PALETTE.white);
    const role = CLASSES_BY_ID[m.def.id]?.role.toUpperCase() ?? '';
    drawText(ctx, role, LEFT.x + LEFT.w - 6 - textWidth(role), LEFT.y + 6, PALETTE.gold);

    // While hovering an item, stats show what they would become, green if up and red if down.
    const now = totalStats(m);
    const shown = preview ? totalStats({ ...m, equipment: { ...m.equipment, [preview.slot]: preview } }) : now;
    const statRows: [keyof Stats, string][][] = [STAT_LABEL.slice(0, 3), STAT_LABEL.slice(3)];
    statRows.forEach((row, r) => {
      let cx = x;
      for (const [k, label] of row) {
        const text = `${label} ${shown[k]}`;
        const color = shown[k] > now[k] ? PALETTE.green : shown[k] < now[k] ? PALETTE.red : PALETTE.lightGray;
        drawText(ctx, text, cx, LEFT.y + 18 + r * 10, color);
        cx += textWidth(text) + 12;
      }
    });

    drawText(ctx, 'GEAR', x, GEAR_TOP - 10, PALETTE.sand);
    EQUIP_SLOTS.forEach((slot, i) => {
      const r = gearRow(i);
      const item = m.equipment[slot];
      this.drawSlotFrame(ctx, r, this.selection.kind === 'gear' && this.selection.slot === slot, inside(pointer, r));
      if (item) drawItemIcon(ctx, item, r.x + 3, r.y + 1);
      else ctx.drawImage(equipIcon(slot), r.x + 3, r.y + 1);
      drawText(ctx, item ? item.name.toUpperCase() : SLOT_LABEL[slot], r.x + 15, r.y + 2, item ? RARITY_COLOR[item.rarity] : PALETTE.slate);
    });

    drawText(ctx, 'SKILLS', x, SKILLS_TOP - 10, PALETTE.sand);
    const note = 'DRAG TO SWAP';
    drawText(ctx, note, LEFT.x + LEFT.w - 6 - textWidth(note), SKILLS_TOP - 10, PALETTE.slate);
    const dragging = this.drag?.moved ? this.drag.from : -1;
    for (let i = 0; i < MAX_SKILLS; i++) {
      const r = skillRow(i);
      const skill = skillInSlot(m, i);
      const dropTarget = dragging >= 0 && i < TIMED_SLOTS && inside(pointer, r);
      this.drawSlotFrame(ctx, r, (this.selection.kind === 'skill' && this.selection.index === i) || dropTarget, inside(pointer, r));
      drawText(ctx, SLOT_TAG[i], r.x + 3, r.y + 2, SLOT_TAG_COLOR[i]);
      if (!skill || i === dragging) {
        drawText(ctx, i === TRIGGER_SLOT ? '- TRIGGER -' : '- EMPTY -', r.x + 15, r.y + 2, PALETTE.slate);
        continue;
      }
      drawText(ctx, skill.name.toUpperCase(), r.x + 15, r.y + 2, skillColor(skill));
      const cd = `${slotCooldown(skill, i).toFixed(1)}S`;
      drawText(ctx, cd, r.x + r.w - 3 - textWidth(cd), r.y + 2, SLOT_TAG_COLOR[i]);
    }
    if (dragging >= 0) {
      const skill = m.skills[dragging];
      const r = { ...skillRow(dragging), x: pointer.x - this.drag!.grabX, y: pointer.y - this.drag!.grabY };
      drawPanel(ctx, r, PALETTE.gold);
      drawText(ctx, skill.name.toUpperCase(), r.x + 15, r.y + 2, skillColor(skill));
    }
  }

  private drawSlotFrame(ctx: CanvasRenderingContext2D, r: Rect, selected: boolean, hover: boolean): void {
    if (selected) {
      ctx.fillStyle = PALETTE.night;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      drawFrame(ctx, r, PALETTE.gold);
      return;
    }
    if (hover) drawFrame(ctx, r, PALETTE.slate);
  }

  private drawInventory(ctx: CanvasRenderingContext2D, entries: Entry[], hoveredRow: number | undefined): void {
    drawPanel(ctx, RIGHT, PALETTE.darkSlate);
    const heading = this.selection.kind === 'gear' ? `INVENTORY: ${SLOT_LABEL[this.selection.slot]}` : 'INVENTORY: SKILLS';
    drawText(ctx, heading, RIGHT.x + 6, RIGHT.y + 6, PALETTE.sand);
    const count = `${entries.filter((e) => !e.block).length} USABLE`;
    drawText(ctx, count, RIGHT.x + RIGHT.w - 6 - textWidth(count), RIGHT.y + 6, PALETTE.slate);

    if (entries.length === 0) drawText(ctx, 'NOTHING HERE', RIGHT.x + 6, LIST_TOP + 2, PALETTE.slate);
    for (let i = 0; i < LIST_ROWS; i++) {
      const entry = entries[this.scroll + i];
      if (!entry) break;
      const r = listRow(i);
      if (i === hoveredRow) drawFrame(ctx, r, entry.block ? PALETTE.darkSlate : PALETTE.lightGray);
      const rarity = entry.kind === 'skill' ? entry.skill.rarity : entry.item.rarity;
      const color = entry.block ? PALETTE.slate : RARITY_COLOR[rarity];
      let textX = r.x + 3;
      if (entry.kind === 'item') {
        if (entry.block) ctx.drawImage(equipIcon(entry.item.slot), r.x + 3, r.y + 1);
        else drawItemIcon(ctx, entry.item, r.x + 3, r.y + 1);
        textX = r.x + 15;
      }
      drawText(ctx, entryName(entry), textX, r.y + 2, color);
      const right = entry.block ?? (entry.kind === 'skill' ? `${entry.skill.cooldown.toFixed(1)}S` : '');
      drawText(ctx, right, r.x + r.w - 3 - textWidth(right), r.y + 2, entry.block ? PALETTE.darkRed : PALETTE.slate);
    }

    // Scrollbar
    const track: Rect = { x: RIGHT.x + RIGHT.w - 8, y: LIST_TOP, w: 3, h: LIST_ROWS * ROW_H };
    ctx.fillStyle = PALETTE.night;
    ctx.fillRect(track.x, track.y, track.w, track.h);
    if (entries.length > LIST_ROWS) {
      const thumbH = Math.max(6, Math.round((track.h * LIST_ROWS) / entries.length));
      const thumbY = track.y + Math.round(((track.h - thumbH) * this.scroll) / (entries.length - LIST_ROWS));
      ctx.fillStyle = PALETTE.slate;
      ctx.fillRect(track.x, thumbY, track.w, thumbH);
    }
  }

  private drawDetail(ctx: CanvasRenderingContext2D, entry: Entry | undefined): void {
    ctx.fillStyle = PALETTE.darkSlate;
    ctx.fillRect(RIGHT.x + 6, DETAIL_TOP - 4, RIGHT.w - 12, 1);
    if (!entry) return;
    const lines = entry.kind === 'skill' ? skillLines(entry.skill) : itemLines(entry.item);
    const maxChars = Math.floor((RIGHT.w - 12) / 6);
    let y = DETAIL_TOP;
    if (entry.kind === 'item') {
      const current = this.member.equipment[entry.item.slot];
      if (current !== entry.item) {
        drawText(ctx, lines[0].text, RIGHT.x + 6, y, lines[0].color);
        y += 9;
        lines.shift();
        let cx = RIGHT.x + 6;
        drawText(ctx, 'CHANGE', cx, y, PALETTE.slate);
        cx += textWidth('CHANGE') + 8;
        for (const [k, label] of STAT_LABEL) {
          const delta = (entry.item.stats[k] ?? 0) - (current?.stats[k] ?? 0);
          const text = `${label} ${delta > 0 ? '+' : ''}${delta}`;
          drawText(ctx, text, cx, y, delta > 0 ? PALETTE.green : delta < 0 ? PALETTE.red : PALETTE.slate);
          cx += textWidth(text) + 6;
        }
        y += 9;
      }
    }
    for (const line of lines) {
      for (const text of wrap(line.text, maxChars)) {
        if (y > RIGHT.y + RIGHT.h - 10) return;
        drawText(ctx, text, RIGHT.x + 6, y, line.color);
        y += 9;
      }
    }
  }
}

function sortButtons(keys: SortKey[]): (Button & { key: SortKey })[] {
  let right = RIGHT.x + RIGHT.w - 6;
  return keys
    .slice()
    .reverse()
    .map((key) => {
      const label = SORT_LABEL[key];
      const w = textWidth(label) + 8;
      right -= w;
      const b = { x: right, y: TOOLBAR_Y, w, h: 11, label, key };
      right -= 3;
      return b;
    })
    .reverse();
}

function matches(e: Entry, search: string): boolean {
  if (!search) return true;
  const theme = e.kind === 'skill' ? (e.skill.theme ?? '').toUpperCase() : '';
  return entryName(e).includes(search) || theme.includes(search);
}

// Cooldown shortest first, name A to Z, rarity legendary first.
function compareBy(sort: SortKey, a: Entry, b: Entry): number {
  switch (sort) {
    case 'cooldown':
      return cooldownOf(a) - cooldownOf(b);
    case 'name':
      return entryName(a).localeCompare(entryName(b));
    case 'rarity':
      return rarityOrder(b) - rarityOrder(a) || accessOrder(a) - accessOrder(b);
  }
}

function cooldownOf(e: Entry): number {
  return e.kind === 'skill' ? e.skill.cooldown : 0;
}

function totalStats(m: PartyMember): Stats {
  const total = { ...m.def.stats };
  for (const item of Object.values(m.equipment)) {
    for (const [k] of STAT_LABEL) total[k] += item?.stats[k] ?? 0;
  }
  return total;
}

function take<T>(inventory: Inventory, list: T[], item: T): T[] {
  return inventory.unlimited ? list : without(list, item);
}

function give<T>(inventory: Inventory, list: T[], item: T): void {
  if (!inventory.unlimited) list.push(item);
}

function without<T>(list: T[], item: T): T[] {
  const index = list.indexOf(item);
  return index < 0 ? list : [...list.slice(0, index), ...list.slice(index + 1)];
}

function entryName(e: Entry): string {
  return (e.kind === 'skill' ? e.skill.name : e.item.name).toUpperCase();
}

function rarityOrder(e: Entry): number {
  return RARITIES.indexOf(e.kind === 'skill' ? e.skill.rarity : e.item.rarity);
}

function accessOrder(e: Entry): number {
  return e.kind === 'skill' ? ACCESS_ORDER[e.skill.access.kind] : 0;
}

function gearRow(i: number): Rect {
  return { x: LEFT.x + 4, y: GEAR_TOP + i * ROW_H, w: LEFT.w - 8, h: ROW_H - 1 };
}

function skillRow(i: number): Rect {
  return { x: LEFT.x + 4, y: SKILLS_TOP + i * ROW_H, w: LEFT.w - 8, h: ROW_H - 1 };
}

function listRow(i: number): Rect {
  return { x: RIGHT.x + 4, y: LIST_TOP + i * ROW_H, w: LIST_W - 4, h: ROW_H - 1 };
}
