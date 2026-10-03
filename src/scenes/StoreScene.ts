import { PALETTE } from '../art/palette';
import { spriteCanvas } from '../art/sprite';
import { SPRITES } from '../art/sprites';
import type { EquipmentDef, PartyMember, SkillDef } from '../combat/types';
import { ITEMS_BY_ID } from '../content/items';
import { SKILLS_BY_ID } from '../content/skills';
import { NATIVE_WIDTH } from '../engine/renderer';
import type { GameContext, Scene } from '../engine/scene';
import { equipItemBlock, equippedSkills, skillAccessBlock } from '../game/loadout';
import type { GameState } from '../game/state';
import { completeNode } from '../run/flow';
import { saveRun, type StoreVisit } from '../run/run';
import { brokenItems, buy, enchant, enchantPrice, itemPrice, repair, repairPrice, sell, sellPrice, skillPrice } from '../run/store';
import { drawBackground } from '../ui/background';
import { itemLines, skillLines, wrap, type Line } from '../ui/describeLines';
import { drawText, textWidth } from '../ui/font';
import { drawItemIcon, STAT_LABEL } from '../ui/partyCard';
import { drawButton, drawFrame, drawPanel, inside, RARITY_COLOR, type Button, type Rect } from '../ui/widgets';
import { MapScene } from './MapScene';

const LEAVE: Button = { x: 8, y: 10, w: 60, h: 20, label: 'LEAVE' };
const CARD_W = 74;
const CARD_H = 72;
const CARD_STEP = 78;
const SKILLS_Y = 56;
const ITEMS_Y = 144;
const SERVICES: Rect = { x: 164, y: 144, w: 152, h: 72 };
const SELL_BUTTON: Button = { x: 172, y: 158, w: 136, h: 16, label: 'SELL GEAR' };
const REPAIR_BUTTON: Button = { x: 172, y: 177, w: 136, h: 16, label: 'REPAIR' };
const ENCHANT_BUTTON: Button = { x: 172, y: 196, w: 136, h: 16, label: 'ENCHANT' };
const KEEPER_X = 367;
const KEEPER_Y = 44;
const COUNTER: Rect = { x: 326, y: 96, w: 146, h: 16 };
const DETAIL: Rect = { x: 326, y: 116, w: 146, h: 120 };
const BUY: Button = { x: 332, y: 214, w: 134, h: 18, label: 'BUY' };
const LIST: Rect = { x: 60, y: 48, w: 360, h: 192 };
const LIST_ROWS = 11;
const ROW_H = 13;
const LIST_ACTION: Button = { x: LIST.x + 8, y: LIST.y + LIST.h - 26, w: 160, h: 18, label: '' };
const LIST_CLOSE: Button = { x: LIST.x + LIST.w - 88, y: LIST.y + LIST.h - 26, w: 80, h: 18, label: 'CLOSE' };
const MESSAGE_TIME = 2;
const LIST_TITLE = { sell: 'SELL GEAR (UNEQUIPPED ONLY)', repair: 'REPAIR BROKEN GEAR (ONE PER VISIT)', enchant: 'ENCHANT GEAR (+1 RANDOM STAT, ONCE EACH)' };
const LIST_EMPTY = { sell: 'NO UNEQUIPPED GEAR.', repair: 'NOTHING HAS BROKEN.', enchant: 'NO GEAR TO ENCHANT.' };
const LIST_VERB = { sell: 'SELL', repair: 'REPAIR', enchant: 'ENCHANT' };

type Pick = { kind: 'skill'; skill: SkillDef } | { kind: 'item'; item: EquipmentDef };

// A Store node: buy from this visit's stock, sell unequipped gear, and repair one broken piece.
export class StoreScene implements Scene {
  private keeper = spriteCanvas(SPRITES.shopkeeper, 'idle');
  private selected: Pick | null = null;
  private list: 'sell' | 'repair' | 'enchant' | null = null;
  private listPick: EquipmentDef | null = null;
  private scroll = 0;
  private message = '';
  private messageAge = MESSAGE_TIME;
  private good = false;

  constructor(private game: GameContext) {}

  enter(): void {
    this.game.input.consumeClicks();
    this.game.input.consumeWheel();
  }

  private get store(): StoreVisit {
    return this.game.state.run!.store!;
  }

  private stock(): { pick: Pick; rect: Rect }[] {
    const skills = this.store.skills.map((id, i): { pick: Pick; rect: Rect } => ({
      pick: { kind: 'skill', skill: SKILLS_BY_ID[id] },
      rect: { x: 8 + i * CARD_STEP, y: SKILLS_Y, w: CARD_W, h: CARD_H },
    }));
    const items = this.store.items.map((id, i): { pick: Pick; rect: Rect } => ({
      pick: { kind: 'item', item: ITEMS_BY_ID[id] },
      rect: { x: 8 + i * CARD_STEP, y: ITEMS_Y, w: CARD_W, h: CARD_H },
    }));
    return [...skills, ...items];
  }

  update(dt: number): void {
    const input = this.game.input;
    this.messageAge += dt;
    const wheel = input.consumeWheel();
    if (this.list) this.scroll = Math.max(0, Math.min(this.listItems().length - LIST_ROWS, this.scroll + wheel));
    for (const click of input.consumeClicks()) {
      if (this.list) {
        this.clickList(click);
        continue;
      }
      this.messageAge = MESSAGE_TIME;
      if (inside(click, LEAVE)) {
        // A revisit from the map: the room is already cleared.
        if (!this.game.state.run!.pending) return this.game.scenes.switchTo(new MapScene(this.game));
        return completeNode(this.game);
      }
      if (inside(click, SELL_BUTTON)) this.openList('sell');
      else if (inside(click, REPAIR_BUTTON)) this.openList('repair');
      else if (inside(click, ENCHANT_BUTTON)) this.openList('enchant');
      else if (this.selected && inside(click, BUY)) this.buySelected();
      else {
        const hit = this.stock().find((s) => inside(click, s.rect));
        if (hit) this.selected = hit.pick;
      }
    }
  }

  private say(message: string, good = false): void {
    this.message = message;
    this.good = good;
    this.messageAge = 0;
  }

  private buySelected(): void {
    const pick = this.selected!;
    const id = pick.kind === 'skill' ? pick.skill.id : pick.item.id;
    const block = buy(this.game.state, pick.kind, id);
    if (block) return this.say(block);
    saveRun(this.game.state);
    this.say(`BOUGHT ${(pick.kind === 'skill' ? pick.skill.name : pick.item.name).toUpperCase()}`, true);
  }

  private openList(kind: 'sell' | 'repair' | 'enchant'): void {
    this.list = kind;
    this.listPick = null;
    this.scroll = 0;
    this.messageAge = MESSAGE_TIME;
  }

  // Sell: unequipped gear in the inventory. Repair: gear broken this run. Enchant: all gear, equipped first.
  private listItems(): EquipmentDef[] {
    const state = this.game.state;
    const byName = (a: EquipmentDef, b: EquipmentDef) => a.name.localeCompare(b.name);
    if (this.list === 'sell') return [...state.inventory.items].sort(byName);
    if (this.list === 'repair') return brokenItems(state);
    const equipped = state.party.flatMap((m) => Object.values(m.equipment).filter((i): i is EquipmentDef => !!i));
    return [...equipped, ...[...state.inventory.items].sort(byName)];
  }

  private listPrice(item: EquipmentDef): number {
    if (this.list === 'sell') return sellPrice(item);
    if (this.list === 'repair') return repairPrice(item);
    return enchantPrice(item);
  }

  private clickList(click: { x: number; y: number }): void {
    if (inside(click, LIST_CLOSE)) {
      this.list = null;
      return;
    }
    if (this.listPick && inside(click, LIST_ACTION)) {
      const state = this.game.state;
      const name = this.listPick.name.toUpperCase();
      if (this.list === 'enchant') {
        const result = enchant(state, this.listPick);
        if (typeof result === 'string') return this.say(result);
        saveRun(state);
        this.say(`${name}: +${result.boost!.amount} ${statLabel(result.boost!.stat)}`, true);
        this.listPick = null;
        return;
      }
      const block = this.list === 'sell' ? sell(state, this.listPick) : repair(state, this.listItems().indexOf(this.listPick));
      if (block) return this.say(block);
      saveRun(state);
      this.say(`${this.list === 'sell' ? 'SOLD' : 'REPAIRED'} ${name}`, true);
      this.listPick = null;
      this.scroll = Math.max(0, Math.min(this.scroll, this.listItems().length - LIST_ROWS));
      return;
    }
    const items = this.listItems();
    const row = [...Array(LIST_ROWS).keys()].find((i) => inside(click, listRow(i)));
    if (row !== undefined && items[this.scroll + row]) this.listPick = items[this.scroll + row];
  }

  render(ctx: CanvasRenderingContext2D): void {
    drawBackground(ctx);
    const state = this.game.state;
    const pointer = this.game.input.pointer;
    const blocked = this.list !== null;
    drawText(ctx, 'STORE', (NATIVE_WIDTH - textWidth('STORE')) / 2, 16, PALETTE.sand);
    const gold = `GOLD ${state.run!.gold}`;
    drawText(ctx, gold, NATIVE_WIDTH - 8 - textWidth(gold), 16, PALETTE.gold);
    drawButton(ctx, LEAVE, !blocked && inside(pointer, LEAVE));

    drawText(ctx, 'SKILLS', 8, SKILLS_Y - 10, PALETTE.sand);
    drawText(ctx, 'ITEMS', 8, ITEMS_Y - 10, PALETTE.sand);
    let hovered: Pick | null = null;
    for (const { pick, rect } of this.stock()) {
      const hover = !blocked && inside(pointer, rect);
      if (hover) hovered = pick;
      this.drawCard(ctx, pick, rect, hover);
    }
    this.drawServices(ctx, pointer, blocked);
    this.drawKeeper(ctx);
    this.drawDetail(ctx, hovered ?? this.selected, pointer, blocked);

    if (this.messageAge < MESSAGE_TIME) drawText(ctx, this.message, 8, 226, this.good ? PALETTE.green : PALETTE.hotRed);
    else drawText(ctx, 'CLICK A CARD, THEN BUY.', 8, 226, PALETTE.slate);

    if (this.list) this.drawList(ctx, pointer);
  }

  private drawCard(ctx: CanvasRenderingContext2D, pick: Pick, r: Rect, hover: boolean): void {
    const id = pick.kind === 'skill' ? pick.skill.id : pick.item.id;
    const sold = this.store.bought.includes(id);
    const chosen = this.selected && (this.selected.kind === 'skill' ? this.selected.skill.id : this.selected.item.id) === id;
    drawPanel(ctx, r, chosen ? PALETTE.gold : hover ? PALETTE.lightGray : PALETTE.darkSlate);
    const def = pick.kind === 'skill' ? pick.skill : pick.item;
    const nameColor = sold ? PALETTE.slate : RARITY_COLOR[def.rarity];
    let y = r.y + 5;
    if (pick.kind === 'item') {
      drawItemIcon(ctx, pick.item, r.x + 5, r.y + 5);
      y += 12;
    }
    for (const line of wrap(def.name.toUpperCase(), 11).slice(0, 3)) {
      drawText(ctx, line, r.x + 5, y, nameColor);
      y += 9;
    }
    if (pick.kind === 'skill') drawText(ctx, `${pick.skill.cooldown.toFixed(1)}S`, r.x + 5, y + 2, PALETTE.slate);
    else drawText(ctx, pick.item.slot.toUpperCase(), r.x + 5, y + 2, PALETTE.slate);
    const price = sold ? 'SOLD' : `${pick.kind === 'skill' ? skillPrice(pick.skill) : itemPrice(pick.item)} G`;
    drawText(ctx, price, r.x + 5, r.y + r.h - 12, sold ? PALETTE.slate : PALETTE.gold);
  }

  private drawServices(ctx: CanvasRenderingContext2D, pointer: { x: number; y: number }, blocked: boolean): void {
    drawPanel(ctx, SERVICES, PALETTE.darkSlate);
    drawText(ctx, 'SERVICES', SERVICES.x + 6, SERVICES.y + 4, PALETTE.sand);
    drawButton(ctx, SELL_BUTTON, !blocked && inside(pointer, SELL_BUTTON));
    const broken = this.game.state.run!.broken.length;
    const repairLabel = this.store.repaired ? 'REPAIR (USED)' : `REPAIR (${broken} BROKEN)`;
    drawButton(ctx, { ...REPAIR_BUTTON, label: repairLabel }, !blocked && inside(pointer, REPAIR_BUTTON));
    drawButton(ctx, ENCHANT_BUTTON, !blocked && inside(pointer, ENCHANT_BUTTON));
  }

  // The shopkeeper stands behind the counter, which hides him from the waist down.
  private drawKeeper(ctx: CanvasRenderingContext2D): void {
    ctx.drawImage(this.keeper, KEEPER_X, KEEPER_Y, 64, 64);
    ctx.fillStyle = PALETTE.brown;
    ctx.fillRect(COUNTER.x, COUNTER.y, COUNTER.w, COUNTER.h);
    ctx.fillStyle = PALETTE.tan;
    ctx.fillRect(COUNTER.x, COUNTER.y, COUNTER.w, 2);
    ctx.fillStyle = PALETTE.darkBrown;
    ctx.fillRect(COUNTER.x, COUNTER.y + COUNTER.h - 2, COUNTER.w, 2);
    for (let x = COUNTER.x + 18; x < COUNTER.x + COUNTER.w; x += 36) ctx.fillRect(x, COUNTER.y + 3, 1, COUNTER.h - 5);
    drawFrame(ctx, COUNTER, PALETTE.black);
    drawPanel(ctx, { x: 330, y: 50, w: 40, h: 13 }, PALETTE.sand);
    drawText(ctx, 'HELLO!', 333, 53, PALETTE.white);
  }

  private drawDetail(ctx: CanvasRenderingContext2D, pick: Pick | null, pointer: { x: number; y: number }, blocked: boolean): void {
    drawPanel(ctx, DETAIL, PALETTE.darkSlate);
    if (!pick) {
      drawText(ctx, 'HOVER A CARD', DETAIL.x + 6, DETAIL.y + 6, PALETTE.slate);
      drawText(ctx, 'FOR DETAILS.', DETAIL.x + 6, DETAIL.y + 15, PALETTE.slate);
      return;
    }
    const state = this.game.state;
    const party = state.party;
    const lines: Line[] =
      pick.kind === 'skill'
        ? [...skillLines(pick.skill), { text: `FOR: ${users(party, (m) => !skillAccessBlock(m, pick.skill))}`, color: PALETTE.cyan }]
        : [
            ...itemLines(pick.item).filter((l) => !l.text.startsWith('REQUIRES')),
            { text: `FOR: ${users(party, (m) => !equipItemBlock(m, pick.item))}`, color: PALETTE.cyan },
          ];
    const owned = ownedText(state, pick);
    if (owned) lines.push({ text: owned, color: PALETTE.orange });
    const maxChars = Math.floor((DETAIL.w - 12) / 6);
    let y = DETAIL.y + 6;
    for (const line of lines) {
      for (const text of wrap(line.text, maxChars)) {
        if (y > BUY.y - 10) break;
        drawText(ctx, text, DETAIL.x + 6, y, line.color);
        y += 9;
      }
    }
    if (pick !== this.selected) return;
    const id = pick.kind === 'skill' ? pick.skill.id : pick.item.id;
    const price = pick.kind === 'skill' ? skillPrice(pick.skill) : itemPrice(pick.item);
    const sold = this.store.bought.includes(id);
    drawButton(ctx, { ...BUY, label: sold ? 'SOLD' : `BUY FOR ${price} G` }, !sold && !blocked && inside(pointer, BUY));
  }

  private drawList(ctx: CanvasRenderingContext2D, pointer: { x: number; y: number }): void {
    drawPanel(ctx, LIST, PALETTE.gold);
    const kind = this.list!;
    drawText(ctx, LIST_TITLE[kind], LIST.x + 8, LIST.y + 6, PALETTE.sand);
    const items = this.listItems();
    if (items.length === 0) drawText(ctx, LIST_EMPTY[kind], LIST.x + 8, LIST.y + 22, PALETTE.slate);
    for (let i = 0; i < LIST_ROWS; i++) {
      const item = items[this.scroll + i];
      if (!item) break;
      const r = listRow(i);
      const chosen = item === this.listPick;
      if (chosen) drawFrame(ctx, r, PALETTE.gold);
      else if (inside(pointer, r)) drawFrame(ctx, r, PALETTE.lightGray);
      drawItemIcon(ctx, item, r.x + 3, r.y + 2);
      drawText(ctx, item.name.toUpperCase(), r.x + 16, r.y + 3, RARITY_COLOR[item.rarity]);
      const owner = this.game.state.party.find((m) => m.equipment[item.slot] === item);
      const note = [owner && `ON ${owner.def.name.toUpperCase()}`, item.boost && `+${item.boost.amount} ${statLabel(item.boost.stat)}`]
        .filter(Boolean)
        .join('  ');
      drawText(ctx, note, r.x + 150, r.y + 3, item.boost ? PALETTE.cyan : PALETTE.slate);
      const enchanted = kind === 'enchant' && item.boost;
      const price = enchanted ? 'ENCHANTED' : `${this.listPrice(item)} G`;
      drawText(ctx, price, r.x + r.w - 4 - textWidth(price), r.y + 3, enchanted ? PALETTE.slate : PALETTE.gold);
    }
    if (this.listPick) {
      const done = kind === 'enchant' && !!this.listPick.boost;
      const action = { ...LIST_ACTION, label: done ? 'ALREADY ENCHANTED' : `${LIST_VERB[kind]} FOR ${this.listPrice(this.listPick)} G` };
      drawButton(ctx, action, !done && inside(pointer, action));
    }
    drawButton(ctx, LIST_CLOSE, inside(pointer, LIST_CLOSE));
    if (this.messageAge < MESSAGE_TIME) drawText(ctx, this.message, LIST.x + 8, LIST_ACTION.y - 13, this.good ? PALETTE.green : PALETTE.hotRed);
  }
}

function listRow(i: number): Rect {
  return { x: LIST.x + 6, y: LIST.y + 18 + i * ROW_H, w: LIST.w - 12, h: ROW_H - 1 };
}

// Who in the party could use it: "ANYONE" when everyone can.
function users(party: PartyMember[], can: (m: PartyMember) => boolean): string {
  const names = party.filter(can).map((m) => m.def.name.toUpperCase());
  return names.length === party.length ? 'ANYONE' : names.join(', ');
}

// Copies the party already has: equipped (and on whom) or in the inventory.
function ownedText(state: GameState, pick: Pick): string | null {
  const id = pick.kind === 'skill' ? pick.skill.id : pick.item.id;
  const holders = state.party.filter((m) =>
    pick.kind === 'skill' ? equippedSkills(m).some((s) => s.id === id) : Object.values(m.equipment).some((i) => i?.id === id),
  );
  const spare = (pick.kind === 'skill' ? state.inventory.skills : state.inventory.items).filter((x) => x.id === id).length;
  const where = [
    holders.length > 0 && `EQUIPPED ON ${holders.map((m) => m.def.name.toUpperCase()).join(', ')}`,
    spare > 0 && `${spare} IN INVENTORY`,
  ].filter(Boolean);
  return where.length > 0 ? `ALREADY OWNED: ${where.join(', ')}` : null;
}

function statLabel(stat: string): string {
  return STAT_LABEL.find(([k]) => k === stat)?.[1] ?? stat.toUpperCase();
}
