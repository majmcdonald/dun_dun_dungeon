import { PALETTE } from '../art/palette';
import type { CombatantDef } from '../combat/types';
import { ENEMIES, MAP_ENCOUNTER } from '../content/enemies';
import { EVENT_LIBRARY } from '../content/events';
import { NATIVE_WIDTH } from '../engine/renderer';
import type { GameContext, Scene } from '../engine/scene';
import { canAfford, choiceChance, chooseOption, type EventDef, type StatCheck } from '../run/events';
import { completeNode } from '../run/flow';
import { saveRun } from '../run/run';
import { drawBackground } from '../ui/background';
import { wrap } from '../ui/describeLines';
import { drawText, textWidth } from '../ui/font';
import { STAT_LABEL } from '../ui/partyCard';
import { drawFrame, inside, type Button, type Rect } from '../ui/widgets';
import { BattleScene } from './BattleScene';

const PARCHMENT: Rect = { x: 16, y: 46, w: 448, h: 216 };
const ART: Rect = { x: 28, y: 58, w: 64, h: 64 };
const TEXT_X = 104;
const TEXT_CHARS = 57;
const CHOICES_Y = 134;
const CHOICE_H = 20;
const CHOICE_STEP = 24;
const CONTINUE: Button = { x: 300, y: 232, w: 152, h: 20, label: 'CONTINUE' };
const INK = PALETTE.deepBrown;

// An Event node: story text and an illustration on parchment, 2–3 choices (some test a party stat), then the
// result. A result that starts a fight leads into battle; otherwise CONTINUE clears the room.
export class EventScene implements Scene {
  private event: EventDef;

  constructor(private game: GameContext) {
    const visit = game.state.run!.event!;
    this.event = EVENT_LIBRARY.find((e) => e.id === visit.id)!;
  }

  enter(): void {
    this.game.input.consumeClicks();
  }

  update(): void {
    const result = this.game.state.run!.event!.result;
    for (const click of this.game.input.consumeClicks()) {
      if (result) {
        if (inside(click, CONTINUE)) return this.finish();
        continue;
      }
      const index = this.event.choices.findIndex((_, i) => inside(click, choiceRect(i)));
      if (index < 0 || !chooseOption(this.game.state, this.event, index)) continue;
      saveRun(this.game.state);
      return;
    }
  }

  private finish(): void {
    const fight = this.game.state.run!.event!.result!.fight;
    if (!fight) return completeNode(this.game);
    const enemies: CombatantDef[] = fight.length > 0 ? fight.map((id) => ENEMIES.find((e) => e.id === id)!) : MAP_ENCOUNTER;
    this.game.scenes.switchTo(new BattleScene(this.game, enemies));
  }

  render(ctx: CanvasRenderingContext2D): void {
    drawBackground(ctx);
    const title = this.event.title;
    drawText(ctx, title, (NATIVE_WIDTH - textWidth(title)) / 2, 16, PALETTE.sand);
    this.drawParchment(ctx);
    this.drawArt(ctx);

    let y = ART.y + 2;
    for (const line of wrap(this.event.text, TEXT_CHARS)) {
      drawText(ctx, line, TEXT_X, y, INK, null);
      y += 10;
    }

    const result = this.game.state.run!.event!.result;
    if (result) return this.drawResult(ctx);
    const pointer = this.game.input.pointer;
    this.event.choices.forEach((choice, i) => {
      const r = choiceRect(i);
      const affordable = canAfford(this.game.state, choice);
      const hover = affordable && inside(pointer, r);
      ctx.fillStyle = hover ? PALETTE.sand : affordable ? PALETTE.tan : PALETTE.sand;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      drawFrame(ctx, r, hover ? PALETTE.deepBrown : PALETTE.brown);
      drawText(ctx, `${i + 1}. ${choice.label}`, r.x + 8, r.y + 7, affordable ? INK : PALETTE.tan, null);
      if (!affordable) {
        const need = `NEED ${choice.cost} G`;
        drawText(ctx, need, r.x + r.w - 8 - textWidth(need), r.y + 7, PALETTE.brown, null);
      } else if (choice.check || choice.chance !== undefined) {
        const tag = checkTag(choice.check, choiceChance(this.game.state, choice));
        drawText(ctx, tag, r.x + r.w - 8 - textWidth(tag), r.y + 7, PALETTE.darkRed, null);
      }
    });
  }

  private drawResult(ctx: CanvasRenderingContext2D): void {
    const result = this.game.state.run!.event!.result!;
    const choice = this.event.choices[result.choice];
    let y = CHOICES_Y;
    drawText(ctx, `- ${choice.label}`, ART.x, y, PALETTE.brown, null);
    y += 14;
    if (choice.check || choice.chance !== undefined) {
      drawText(ctx, result.success ? 'SUCCESS!' : 'FAILED!', ART.x, y, result.success ? PALETTE.darkGreen : PALETTE.darkRed, null);
      y += 12;
    }
    for (const line of wrap(result.text, 70)) {
      drawText(ctx, line, ART.x, y, INK, null);
      y += 10;
    }
    y += 2;
    for (const line of result.lines) {
      drawText(ctx, line, ART.x, y, lineColor(line), null);
      y += 10;
    }
    const pointer = this.game.input.pointer;
    const button = { ...CONTINUE, label: result.fight ? 'FIGHT!' : 'CONTINUE' };
    const hover = inside(pointer, button);
    ctx.fillStyle = hover ? PALETTE.sand : PALETTE.tan;
    ctx.fillRect(button.x, button.y, button.w, button.h);
    drawFrame(ctx, button, hover ? PALETTE.deepBrown : PALETTE.brown);
    drawText(ctx, button.label, button.x + (button.w - textWidth(button.label)) / 2, button.y + 7, result.fight ? PALETTE.darkRed : INK, null);
  }

  private drawParchment(ctx: CanvasRenderingContext2D): void {
    const p = PARCHMENT;
    ctx.fillStyle = PALETTE.sand;
    ctx.fillRect(p.x, p.y, p.w, p.h);
    // Darker, uneven edges like old paper.
    ctx.fillStyle = PALETTE.tan;
    ctx.fillRect(p.x, p.y, p.w, 3);
    ctx.fillRect(p.x, p.y + p.h - 3, p.w, 3);
    ctx.fillRect(p.x, p.y, 3, p.h);
    ctx.fillRect(p.x + p.w - 3, p.y, 3, p.h);
    for (let x = p.x + 7; x < p.x + p.w - 7; x += 23) {
      ctx.fillRect(x, p.y + 3, 4, 1);
      ctx.fillRect(x + 11, p.y + p.h - 4, 3, 1);
    }
    drawFrame(ctx, p, PALETTE.brown);
  }

  // Placeholder frame until the event illustrations are drawn.
  private drawArt(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = PALETTE.tan;
    ctx.fillRect(ART.x, ART.y, ART.w, ART.h);
    ctx.fillStyle = PALETTE.sand;
    for (let d = 0; d < ART.w; d += 8) ctx.fillRect(ART.x + d, ART.y, 1, ART.h);
    drawFrame(ctx, ART, PALETTE.brown);
    const label = this.event.art.toUpperCase();
    drawText(ctx, label, ART.x + (ART.w - textWidth(label)) / 2, ART.y + 28, PALETTE.brown, null);
  }
}

function choiceRect(i: number): Rect {
  return { x: ART.x, y: CHOICES_Y + i * CHOICE_STEP, w: PARCHMENT.x + PARCHMENT.w - 12 - ART.x, h: CHOICE_H };
}

// What is tested and the odds, never the outcome: e.g. "BEST MAG: PASS 45% FAIL 55%", or "LUCK: PASS 50% FAIL 50%".
function checkTag(check: StatCheck | undefined, chance: number): string {
  const pass = Math.round(chance * 100);
  const odds = `PASS ${pass}% FAIL ${100 - pass}%`;
  if (!check) return `LUCK: ${odds}`;
  const stat = STAT_LABEL.find(([k]) => k === check.stat)?.[1] ?? check.stat.toUpperCase();
  return `${check.mode === 'highest' ? 'BEST' : 'PARTY'} ${stat}: ${odds}`;
}

function lineColor(line: string): string {
  if (line.startsWith('-') || line.startsWith('LOST') || line.startsWith('WOUNDED')) return PALETTE.darkRed;
  if (line.includes('GOLD')) return PALETTE.brown;
  return PALETTE.darkGreen;
}
