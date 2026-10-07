import { PALETTE } from '../art/palette';
import { CLASSES, CLASSES_BY_ID } from '../content/classes';
import { NATIVE_WIDTH } from '../engine/renderer';
import type { GameContext, Scene } from '../engine/scene';
import { loadProfile, type Profile, type Tally } from '../run/profile';
import { drawBackground } from '../ui/background';
import { drawText, textWidth } from '../ui/font';
import { drawButton, drawPanel, inside, type Button, type Rect } from '../ui/widgets';
import { TitleScene } from './TitleScene';

const OVERALL: Rect = { x: 10, y: 30, w: 136, h: 204 };
const BY_CLASS: Rect = { x: 152, y: 30, w: 136, h: 204 };
const BY_PARTY: Rect = { x: 294, y: 30, w: 176, h: 204 };
const BACK: Button = { x: (NATIVE_WIDTH - 100) / 2, y: 242, w: 100, h: 20, label: 'BACK' };
const ROW_H = 11;
const PARTY_ROWS = 15;

// A save slot's lifetime stats: totals, then win records by class and by party (most played first).
export class StatsScene implements Scene {
  private profile: Profile;

  constructor(
    private game: GameContext,
    private slot: number,
  ) {
    this.profile = loadProfile(slot);
  }

  enter(): void {
    this.game.input.consumeClicks();
  }

  update(): void {
    if (this.game.input.consumeClicks().some((c) => inside(c, BACK))) this.game.scenes.switchTo(new TitleScene(this.game));
  }

  render(ctx: CanvasRenderingContext2D): void {
    drawBackground(ctx);
    const title = `SLOT ${this.slot + 1} STATS`;
    drawText(ctx, title, (NATIVE_WIDTH - textWidth(title)) / 2, 12, PALETTE.sand);
    this.drawOverall(ctx);
    this.drawByClass(ctx);
    this.drawByParty(ctx);
    drawButton(ctx, BACK, inside(this.game.input.pointer, BACK));
  }

  private drawOverall(ctx: CanvasRenderingContext2D): void {
    const p = this.profile;
    drawPanel(ctx, OVERALL, PALETTE.darkSlate);
    drawText(ctx, 'OVERALL', OVERALL.x + 6, OVERALL.y + 6, PALETTE.sand);
    const rows: [string, string, string][] = [
      ['RUNS', `${p.runs}`, PALETTE.white],
      ['WINS', `${p.wins}`, PALETTE.gold],
      ['WIN RATE', winRate(p), PALETTE.white],
      ['BEST', p.best ? `ACT ${p.best.level + 1} RM ${p.best.room}` : '-', PALETTE.white],
      ['BOSSES', `${p.bosses}`, PALETTE.white],
      ['EPIC MONSTERS', `${p.epics}`, PALETTE.white],
      ['EVENTS', `${p.events}`, PALETTE.white],
      ['CLASSES', `${p.unlocked.length}/${CLASSES.length}`, PALETTE.green],
    ];
    rows.forEach(([label, value, color], i) => this.row(ctx, OVERALL, i, label, value, PALETTE.lightGray, color));
  }

  private drawByClass(ctx: CanvasRenderingContext2D): void {
    drawPanel(ctx, BY_CLASS, PALETTE.darkSlate);
    this.header(ctx, BY_CLASS, 'BY CLASS');
    CLASSES.forEach((c, i) => {
      const open = this.profile.unlocked.includes(c.id);
      this.row(ctx, BY_CLASS, i, open ? c.name.toUpperCase() : 'LOCKED', record(this.profile.byClass[c.id]), open ? PALETTE.lightGray : PALETTE.slate);
    });
  }

  private drawByParty(ctx: CanvasRenderingContext2D): void {
    drawPanel(ctx, BY_PARTY, PALETTE.darkSlate);
    this.header(ctx, BY_PARTY, 'BY PARTY');
    const parties = Object.entries(this.profile.byParty)
      .sort(([, a], [, b]) => b.runs - a.runs || b.wins - a.wins)
      .slice(0, PARTY_ROWS);
    if (parties.length === 0) drawText(ctx, 'NO RUNS YET', BY_PARTY.x + 6, BY_PARTY.y + 20, PALETTE.slate);
    parties.forEach(([key, tally], i) => {
      const names = key.split('+').map((id) => CLASSES_BY_ID[id]?.name.slice(0, 3).toUpperCase() ?? id).join(' ');
      this.row(ctx, BY_PARTY, i, names, record(tally), PALETTE.lightGray);
    });
  }

  private header(ctx: CanvasRenderingContext2D, rect: Rect, title: string): void {
    drawText(ctx, title, rect.x + 6, rect.y + 6, PALETTE.sand);
    const cols = 'RUNS WINS';
    drawText(ctx, cols, rect.x + rect.w - 6 - textWidth(cols), rect.y + 6, PALETTE.slate);
  }

  private row(ctx: CanvasRenderingContext2D, rect: Rect, i: number, label: string, value: string, labelColor: string, valueColor: string = PALETTE.white): void {
    const y = rect.y + 20 + i * ROW_H;
    drawText(ctx, label, rect.x + 6, y, labelColor);
    drawText(ctx, value, rect.x + rect.w - 6 - textWidth(value), y, valueColor);
  }
}

function record(t: Tally | undefined): string {
  return t ? `${String(t.runs).padStart(3)}  ${String(t.wins).padStart(3)}` : '  -    -';
}

function winRate(p: Profile): string {
  return p.runs === 0 ? '-' : `${Math.round((p.wins / p.runs) * 100)}%`;
}
