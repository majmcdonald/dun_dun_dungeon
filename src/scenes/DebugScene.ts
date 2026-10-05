import { PALETTE } from '../art/palette';
import { drawFitted, spriteCanvas } from '../art/sprite';
import { SPRITES } from '../art/sprites';
import type { CombatantDef, PartyMember } from '../combat/types';
import { CLASSES, CLASSES_BY_ID } from '../content/classes';
import { MAP_ENCOUNTER } from '../content/enemies';
import { ITEM_LIBRARY } from '../content/items';
import { SKILL_LIBRARY } from '../content/skills';
import { NATIVE_WIDTH } from '../engine/renderer';
import type { GameContext, Scene } from '../engine/scene';
import { equippedSkills } from '../game/loadout';
import { recruit } from '../game/state';
import { drawBackground } from '../ui/background';
import { drawText, textWidth } from '../ui/font';
import { drawEquipmentIcons } from '../ui/partyCard';
import { drawButton, drawFrame, drawPanel, inside, type Button, type Rect } from '../ui/widgets';
import { BattleScene } from './BattleScene';
import { LoadoutScene } from './LoadoutScene';
import { MonsterPickerScene } from './MonsterPickerScene';
import { TitleScene } from './TitleScene';

const PARTY_SIZE = 3;
const GRID_CELLS = 9;

const TITLE: Button = { x: 8, y: 10, w: 60, h: 20, label: 'TITLE' };
const PARTY_PANEL: Rect = { x: 8, y: 46, w: 262, h: 192 };
const ENEMY_PANEL: Rect = { x: 278, y: 46, w: 194, h: 192 };
const ROW_H = 58;
const CELL = 40;
const CELL_STEP = 44;
const GRID_X = 300;
const GRID_Y = 66;
const CLEAR: Button = { x: 346, y: 208, w: 58, h: 18, label: 'CLEAR' };
const FIGHT: Button = { x: 332, y: 243, w: 140, h: 22, label: 'FIGHT' };
const PICKER: Rect = { x: 20, y: 58, w: 440, h: 0 };
const CHIP_W = 72;
const CHIP_H = 68;

type Picker = { kind: 'class'; slot: number };

interface Drag {
  from: number;
  grabY: number;
}

// Kept across fights so the debug screen comes back exactly as it was left.
let encounter: (CombatantDef | null)[] = [...MAP_ENCOUNTER];

// Dev and balancing tool: any party (locked classes too), any skills and gear from an unlimited inventory,
// any enemy layout, then FIGHT and come back here.
export class DebugScene implements Scene {
  private sprites = new Map<string, HTMLCanvasElement>();
  private picker: Picker | null = null;
  private drag: Drag | null = null;

  constructor(private game: GameContext) {
    const state = game.state;
    state.run = null;
    state.inventory = { skills: [...SKILL_LIBRARY], items: [...ITEM_LIBRARY], unlimited: true };
    if (state.party.length === 0) state.party = ['knight', 'mage', 'cleric'].map((id) => recruit(CLASSES_BY_ID[id]));
  }

  enter(): void {
    this.game.input.consumeClicks();
    this.game.input.consumePresses();
  }

  update(): void {
    const input = this.game.input;
    for (const press of input.consumePresses()) {
      if (this.picker) continue;
      const index = this.game.state.party.findIndex((_, i) => inside(press, rowRect(i)));
      if (index < 0) continue;
      const buttons = rowButtons(rowRect(index));
      if ([buttons.cls, buttons.edit, buttons.remove].some((b) => inside(press, b))) continue;
      this.drag = { from: index, grabY: press.y - rowRect(index).y };
    }

    const clicks = input.consumeClicks();
    if (this.drag) {
      if (input.pointer.down) return;
      this.game.state.party = this.previewOrder();
      this.drag = null;
      return;
    }
    for (const click of clicks) {
      if (this.picker) {
        this.pick(click);
        continue;
      }
      if (inside(click, TITLE)) return this.game.scenes.switchTo(new TitleScene(this.game));
      if (inside(click, FIGHT)) return this.fight();
      if (inside(click, CLEAR)) encounter = [];
      const cell = [...Array(GRID_CELLS).keys()].find((p) => inside(click, cellRect(p)));
      if (cell !== undefined) return this.pickMonster(cell);
      this.clickParty(click);
    }
  }

  private clickParty(click: { x: number; y: number }): void {
    const party = this.game.state.party;
    for (let i = 0; i < PARTY_SIZE; i++) {
      const row = rowRect(i);
      if (!inside(click, row)) continue;
      if (!party[i]) {
        this.picker = { kind: 'class', slot: Math.min(i, party.length) };
        return;
      }
      const buttons = rowButtons(row);
      if (inside(click, buttons.cls)) this.picker = { kind: 'class', slot: i };
      else if (inside(click, buttons.edit)) this.game.scenes.switchTo(new LoadoutScene(this.game, i, () => new DebugScene(this.game)));
      else if (inside(click, buttons.remove)) this.game.state.party = party.filter((_, k) => k !== i);
      return;
    }
  }

  // A click inside the picker chooses; anywhere else closes it unchanged.
  private pick(click: { x: number; y: number }): void {
    const picker = this.picker!;
    this.picker = null;
    const def = CLASSES.find((_, i) => inside(click, chipRect(i)));
    if (!def) return;
    const party = [...this.game.state.party];
    party[picker.slot] = recruit(def);
    this.game.state.party = party;
  }

  private pickMonster(cell: number): void {
    const scenes = this.game.scenes;
    const returnHere = () => scenes.switchTo(new DebugScene(this.game));
    const choose = (def: CombatantDef | null) => {
      encounter[cell] = def;
      returnHere();
    };
    scenes.switchTo(new MonsterPickerScene(this.game, encounter[cell] ?? null, choose, returnHere));
  }

  // Gear breaks on KO, so the fight runs on a copy of the setup and the original comes back afterwards.
  private fight(): void {
    const state = this.game.state;
    if (state.party.length === 0 || !encounter.some(Boolean)) return;
    const setup = state.party;
    this.game.scenes.switchTo(
      new BattleScene(this.game, [...encounter], () => {
        state.party = setup;
        return new DebugScene(this.game);
      }),
    );
  }

  private dropIndex(): number {
    const count = this.game.state.party.length;
    const y = this.game.input.pointer.y;
    for (let i = 0; i < count; i++) {
      const r = rowRect(i);
      if (y < r.y + r.h) return i;
    }
    return count - 1;
  }

  // The order the party would have if the dragged row were dropped right now.
  private previewOrder(): PartyMember[] {
    const party = [...this.game.state.party];
    if (!this.drag) return party;
    const [moved] = party.splice(this.drag.from, 1);
    party.splice(this.dropIndex(), 0, moved);
    return party;
  }

  render(ctx: CanvasRenderingContext2D): void {
    drawBackground(ctx);
    const title = 'DEBUG';
    drawText(ctx, title, (NATIVE_WIDTH - textWidth(title)) / 2, 16, PALETTE.sand);
    const pointer = this.game.input.pointer;
    const blocked = this.picker !== null || this.drag !== null;
    drawButton(ctx, TITLE, !blocked && inside(pointer, TITLE));

    this.drawParty(ctx, pointer, blocked);
    this.drawEncounter(ctx, pointer, blocked);

    drawText(ctx, 'DRAG CHARACTERS TO REORDER.', 8, 244, PALETTE.slate);
    drawText(ctx, 'EDIT USES AN UNLIMITED INVENTORY.', 8, 255, PALETTE.slate);
    const ready = this.game.state.party.length > 0 && encounter.some(Boolean);
    if (ready) drawButton(ctx, FIGHT, !blocked && inside(pointer, FIGHT));

    if (this.picker) this.drawClassPicker(ctx, pointer);
  }

  private drawParty(ctx: CanvasRenderingContext2D, pointer: { x: number; y: number }, blocked: boolean): void {
    drawPanel(ctx, PARTY_PANEL, PALETTE.darkSlate);
    drawText(ctx, 'PARTY', PARTY_PANEL.x + 6, PARTY_PANEL.y + 6, PALETTE.sand);
    const party = this.previewOrder();
    const dragged = this.drag ? this.game.state.party[this.drag.from] : null;
    for (let i = 0; i < PARTY_SIZE; i++) {
      const row = rowRect(i);
      const member = party[i];
      if (member && member === dragged) {
        drawFrame(ctx, row, PALETTE.slate);
        continue;
      }
      const hover = !blocked && inside(pointer, row);
      if (!member) {
        drawPanel(ctx, row, hover ? PALETTE.slate : PALETTE.night);
        if (i === party.length) {
          const add = '+ ADD CHARACTER';
          drawText(ctx, add, row.x + (row.w - textWidth(add)) / 2, row.y + (row.h - 7) / 2, hover ? PALETTE.white : PALETTE.slate);
        }
        continue;
      }
      this.drawRow(ctx, member, i, row, hover ? PALETTE.slate : PALETTE.night, blocked ? null : pointer);
    }
    if (dragged) {
      const row = { ...rowRect(0), y: pointer.y - this.drag!.grabY };
      this.drawRow(ctx, dragged, party.indexOf(dragged), row, PALETTE.gold, null);
    }
  }

  private drawRow(
    ctx: CanvasRenderingContext2D,
    member: PartyMember,
    index: number,
    row: Rect,
    border: string,
    pointer: { x: number; y: number } | null,
  ): void {
    drawPanel(ctx, row, border);
    drawFitted(ctx, this.sprite(member.def.id), row.x + 4, row.y + (row.h - 32) / 2);
    drawText(ctx, `${index + 1} ${member.def.name.toUpperCase()}`, row.x + 40, row.y + 5, PALETTE.white);
    const names = equippedSkills(member).map((s) => s.name.toUpperCase());
    drawText(ctx, clip(names.slice(0, 2).join(', '), 21), row.x + 40, row.y + 16, PALETTE.lightGray);
    drawText(ctx, clip(names.slice(2).join(', '), 21), row.x + 40, row.y + 26, PALETTE.lightGray);
    drawEquipmentIcons(ctx, member.equipment, row.x + 41, row.y + 40);
    const buttons = rowButtons(row);
    for (const b of [buttons.cls, buttons.edit, buttons.remove]) drawButton(ctx, b, !!pointer && inside(pointer, b));
  }

  private drawEncounter(ctx: CanvasRenderingContext2D, pointer: { x: number; y: number }, blocked: boolean): void {
    drawPanel(ctx, ENEMY_PANEL, PALETTE.darkSlate);
    drawText(ctx, 'ENCOUNTER', ENEMY_PANEL.x + 6, ENEMY_PANEL.y + 6, PALETTE.sand);
    drawText(ctx, 'FRONT', GRID_X, GRID_Y + 3 * CELL_STEP - 2, PALETTE.slate);
    for (let p = 0; p < GRID_CELLS; p++) {
      const r = cellRect(p);
      drawPanel(ctx, r, !blocked && inside(pointer, r) ? PALETTE.lightGray : PALETTE.night);
      const def = encounter[p];
      if (def) drawFitted(ctx, this.sprite(def.id), r.x + (CELL - 32) / 2, r.y + (CELL - 32) / 2);
    }
    drawButton(ctx, CLEAR, !blocked && inside(pointer, CLEAR));
  }

  private drawClassPicker(ctx: CanvasRenderingContext2D, pointer: { x: number; y: number }): void {
    drawPanel(ctx, pickerRect(CLASSES.length), PALETTE.gold);
    drawText(ctx, 'PICK A CLASS', PICKER.x + 8, PICKER.y + 6, PALETTE.sand);
    CLASSES.forEach((def, i) => {
      const color = def.starting ? PALETTE.white : PALETTE.magenta;
      this.drawChip(ctx, chipRect(i), def.id, def.name.toUpperCase(), color, null, pointer);
    });
  }

  private drawChip(
    ctx: CanvasRenderingContext2D,
    r: Rect,
    spriteId: string | null,
    name: string,
    color: string,
    detail: string[] | null,
    pointer: { x: number; y: number },
  ): void {
    drawPanel(ctx, r, inside(pointer, r) ? PALETTE.lightGray : PALETTE.darkSlate);
    if (spriteId) drawFitted(ctx, this.sprite(spriteId), r.x + (r.w - 32) / 2, r.y + 2);
    drawText(ctx, name, r.x + (r.w - textWidth(name)) / 2, r.y + (detail ? 36 : 46), color);
    detail?.forEach((line, i) => drawText(ctx, line, r.x + (r.w - textWidth(line)) / 2, r.y + 46 + i * 9, PALETTE.slate));
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

function rowRect(i: number): Rect {
  return { x: PARTY_PANEL.x + 4, y: PARTY_PANEL.y + 18 + i * ROW_H, w: PARTY_PANEL.w - 8, h: ROW_H - 4 };
}

function rowButtons(row: Rect): { cls: Button; edit: Button; remove: Button } {
  const x = row.x + row.w - 58;
  return {
    cls: { x, y: row.y + 4, w: 54, h: 14, label: 'CLASS' },
    edit: { x, y: row.y + 21, w: 54, h: 14, label: 'EDIT' },
    remove: { x, y: row.y + 38, w: 54, h: 14, label: 'REMOVE' },
  };
}

// Position p: column 0 (the front line) is drawn nearest the party, on the left.
function cellRect(p: number): Rect {
  const row = p % 3;
  const column = Math.floor(p / 3);
  return { x: GRID_X + column * CELL_STEP, y: GRID_Y + row * CELL_STEP, w: CELL, h: CELL };
}

// Tall enough for however many rows of 6 chips there are.
function pickerRect(count: number): Rect {
  return { ...PICKER, h: 24 + Math.ceil(count / 6) * CHIP_H };
}

function chipRect(i: number): Rect {
  return { x: PICKER.x + 6 + (i % 6) * CHIP_W, y: PICKER.y + 20 + Math.floor(i / 6) * CHIP_H, w: CHIP_W - 4, h: CHIP_H - 4 };
}

function clip(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}.` : text;
}
