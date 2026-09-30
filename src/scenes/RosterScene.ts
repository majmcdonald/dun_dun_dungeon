import { PALETTE } from '../art/palette';
import { spriteCanvas } from '../art/sprite';
import { SPRITES } from '../art/sprites';
import { MECHANIC } from '../combat/battle';
import type { Mechanic } from '../combat/types';
import { CLASSES, type ClassDef } from '../content/classes';
import { NATIVE_WIDTH } from '../engine/renderer';
import type { GameContext, Scene } from '../engine/scene';
import { describeEffect, describeTarget } from '../game/describe';
import { recruit } from '../game/state';
import { drawBackground } from '../ui/background';
import { drawText, LINE_HEIGHT, textWidth } from '../ui/font';
import { drawButton, drawPanel, inside, type Button, type Rect } from '../ui/widgets';
import { PreBattleScene } from './PreBattleScene';

const TITLE = 'CHOOSE YOUR PARTY';
const PARTY_SIZE = 3;
const COLUMNS = 6;
const CHIP_W = 76;
const CHIP_H = 54;
const GRID_X = 10;
const GRID_Y = 44;
const DETAIL: Rect = { x: 10, y: 160, w: 300, h: 102 };
const PARTY_PANEL: Rect = { x: 318, y: 160, w: 152, h: 102 };
const BEGIN: Button = { x: 326, y: 234, w: 136, h: 20, label: 'BEGIN RUN' };

const MECHANIC_TEXT: Record<Mechanic, string[]> = {
  rage: ['RAGE: FILLS AS HP IS LOST. AT FULL, FRENZY:', `TIMERS X${MECHANIC.frenzySpeed} FOR ${MECHANIC.frenzySeconds}S.`],
  souls: [`SOULS: +1 WHEN ANY UNIT DIES (MAX ${MECHANIC.soulsMax}).`, 'SOUL SPELLS SPEND THEM.'],
  chi: [
    `CHI: +${MECHANIC.chiPerHit} PER HIT, DAMAGE X${MECHANIC.chiFilling} WHILE FILLING.`,
    `FULL: CHI BURST, DAMAGE X${MECHANIC.chiBurst} FOR ${MECHANIC.burstSeconds}S.`,
  ],
  familiar: [`FAMILIAR: SUMMONS AN IMP OVER ${MECHANIC.channelSeconds}S AT THE`, 'START OF BATTLE AND AFTER IT DIES.'],
};

interface Chip {
  def: ClassDef;
  rect: Rect;
  sprite: HTMLCanvasElement;
}

// Run start: pick 3 of the unlocked classes. Locked classes show as silhouettes until run milestones unlock them.
export class RosterScene implements Scene {
  private chips: Chip[] = CLASSES.map((def, i) => ({
    def,
    rect: { x: GRID_X + (i % COLUMNS) * CHIP_W, y: GRID_Y + Math.floor(i / COLUMNS) * CHIP_H, w: CHIP_W - 4, h: CHIP_H - 4 },
    sprite: def.starting ? spriteCanvas(SPRITES[def.id], 'idle') : spriteCanvas(SPRITES[def.id], 'idle', 'night'),
  }));
  private picked: ClassDef[] = [];
  private focus: ClassDef | null = null;

  constructor(private game: GameContext) {}

  update(): void {
    for (const click of this.game.input.consumeClicks()) {
      if (this.picked.length === PARTY_SIZE && inside(click, BEGIN)) {
        this.game.state.party = this.picked.map(recruit);
        return this.game.scenes.switchTo(new PreBattleScene(this.game));
      }
      const chip = this.chips.find((c) => inside(click, c.rect));
      if (!chip) continue;
      this.focus = chip.def;
      if (!chip.def.starting) continue;
      const index = this.picked.indexOf(chip.def);
      if (index >= 0) this.picked.splice(index, 1);
      else if (this.picked.length < PARTY_SIZE) this.picked.push(chip.def);
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    drawBackground(ctx);
    drawText(ctx, TITLE, (NATIVE_WIDTH - textWidth(TITLE)) / 2, 16, PALETTE.sand);

    const pointer = this.game.input.pointer;
    const hovered = this.chips.find((c) => inside(pointer, c.rect));
    for (const chip of this.chips) this.drawChip(ctx, chip, chip === hovered);
    this.drawDetail(ctx, hovered?.def ?? this.focus);
    this.drawParty(ctx);
  }

  private drawChip(ctx: CanvasRenderingContext2D, chip: Chip, hover: boolean): void {
    const { def, rect } = chip;
    const order = this.picked.indexOf(def);
    const border = order >= 0 ? PALETTE.gold : hover ? PALETTE.lightGray : PALETTE.darkSlate;
    drawPanel(ctx, rect, border);
    ctx.drawImage(chip.sprite, rect.x + (rect.w - 32) / 2, rect.y + 3);
    const name = def.starting ? def.name.toUpperCase() : 'LOCKED';
    const color = order >= 0 ? PALETTE.gold : def.starting ? PALETTE.white : PALETTE.slate;
    drawText(ctx, name, rect.x + (rect.w - textWidth(name)) / 2, rect.y + 38, color);
    if (order >= 0) drawText(ctx, `${order + 1}`, rect.x + 4, rect.y + 4, PALETTE.gold);
  }

  private drawDetail(ctx: CanvasRenderingContext2D, def: ClassDef | null): void {
    drawPanel(ctx, DETAIL, PALETTE.darkSlate);
    const x = DETAIL.x + 6;
    let y = DETAIL.y + 6;
    const line = (text: string, color: string) => {
      drawText(ctx, text, x, y, color);
      y += LINE_HEIGHT + 2;
    };
    if (!def) {
      line('SELECT A CLASS TO SEE ITS DETAILS.', PALETTE.gray);
      return;
    }
    if (!def.starting) {
      line('LOCKED', PALETTE.slate);
      line('UNLOCKED BY REACHING RUN MILESTONES.', PALETTE.gray);
      return;
    }
    drawText(ctx, def.name.toUpperCase(), x, y, PALETTE.white);
    const role = def.role.toUpperCase();
    drawText(ctx, role, DETAIL.x + DETAIL.w - 6 - textWidth(role), y, PALETTE.gold);
    y += LINE_HEIGHT + 2;
    line((def.tags ?? []).map((t) => t.toUpperCase()).join('  '), PALETTE.cyan);
    const s = def.stats;
    line(`HP ${s.hp}  ATK ${s.attack}  MAG ${s.magic}  DEF ${s.defense}  RES ${s.resistance}`, PALETTE.lightGray);
    for (const skill of def.skills) {
      const head = `${skill.name.toUpperCase()}  ${skill.cooldown.toFixed(1)}S`;
      drawText(ctx, head, x, y, skill.category === 'spell' ? PALETTE.cyan : PALETTE.white);
      const target = describeTarget(skill.target);
      drawText(ctx, target, DETAIL.x + DETAIL.w - 6 - textWidth(target), y, PALETTE.slate);
      y += LINE_HEIGHT + 1;
      line(`  ${skill.effects.map(describeEffect).join('; ')}`, PALETTE.lightGray);
    }
    for (const text of def.mechanic ? MECHANIC_TEXT[def.mechanic] : []) line(text, PALETTE.magenta);
  }

  private drawParty(ctx: CanvasRenderingContext2D): void {
    drawPanel(ctx, PARTY_PANEL, PALETTE.darkSlate);
    const x = PARTY_PANEL.x + 6;
    drawText(ctx, 'PARTY', x, PARTY_PANEL.y + 6, PALETTE.sand);
    for (let i = 0; i < PARTY_SIZE; i++) {
      const def = this.picked[i];
      const y = PARTY_PANEL.y + 20 + i * 11;
      drawText(ctx, `${i + 1}`, x, y, def ? PALETTE.gold : PALETTE.night);
      drawText(ctx, def ? def.name.toUpperCase() : '- EMPTY -', x + 12, y, def ? PALETTE.white : PALETTE.night);
    }
    const ready = this.picked.length === PARTY_SIZE;
    if (ready) drawButton(ctx, BEGIN, inside(this.game.input.pointer, BEGIN));
    else drawText(ctx, `PICK ${PARTY_SIZE - this.picked.length} MORE`, BEGIN.x + 30, BEGIN.y + 6, PALETTE.gray);
  }
}
