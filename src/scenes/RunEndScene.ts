import { PALETTE } from '../art/palette';
import { spriteCanvas } from '../art/sprite';
import { SPRITES } from '../art/sprites';
import { NATIVE_WIDTH } from '../engine/renderer';
import type { GameContext, Scene } from '../engine/scene';
import { LEVELS, type RunSummary } from '../run/run';
import { drawBackground } from '../ui/background';
import { drawText, textWidth } from '../ui/font';
import { drawButton, drawPanel, inside, type Button, type Rect } from '../ui/widgets';
import { TitleScene } from './TitleScene';


const TITLE_SCALE = 2;
const VALUE_COLOR: Record<string, string> = { 'GOLD EARNED': PALETTE.gold, 'DAMAGE DONE': PALETTE.green, 'DAMAGE TAKEN': PALETTE.red };
const SPRITE_SCALE = 2;
const SPRITE_STEP = 96;
const SPRITES_TOP = 64;
const STATS: Rect = { x: 130, y: 132, w: 220, h: 110 };
const TITLE_BUTTON: Button = { x: 170, y: 246, w: 140, h: 20, label: 'BACK TO TITLE' };

// End of a run: victory after the level 3 boss, or Run Over when the whole party falls. The save slot is already freed.
export class RunEndScene implements Scene {
  private sprites: HTMLCanvasElement[];

  constructor(
    private game: GameContext,
    private summary: RunSummary,
  ) {
    // The fallen party shows as dark silhouettes.
    this.sprites = summary.party.map((id) => spriteCanvas(SPRITES[id], 'idle', summary.won ? undefined : 'night'));
  }

  enter(): void {
    this.game.input.consumeClicks();
  }

  update(): void {
    if (this.game.input.consumeClicks().some((c) => inside(c, TITLE_BUTTON))) {
      this.game.scenes.switchTo(new TitleScene(this.game));
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const { won, level, where, stats } = this.summary;
    drawBackground(ctx);
    const title = won ? 'VICTORY' : 'RUN OVER';
    drawText(ctx, title, (NATIVE_WIDTH - textWidth(title, TITLE_SCALE)) / 2, 13, won ? PALETTE.gold : PALETTE.red, PALETTE.black, TITLE_SCALE);

    const sub = won ? 'THE DUNGEON IS CONQUERED!' : `THE PARTY FELL ON LEVEL ${level}, ${where}`;
    drawText(ctx, sub, (NATIVE_WIDTH - textWidth(sub)) / 2, 46, won ? PALETTE.sand : PALETTE.lightGray);
    if (!won && this.summary.slayers.length > 0) {
      const label = 'SLAIN BY: ';
      const names = this.summary.slayers.join(', ');
      const x = (NATIVE_WIDTH - textWidth(label + names)) / 2;
      drawText(ctx, label, x, 56, PALETTE.slate);
      drawText(ctx, names, x + textWidth(label) + 1, 56, PALETTE.red);
    }

    const size = 32 * SPRITE_SCALE;
    const left = (NATIVE_WIDTH - (this.sprites.length - 1) * SPRITE_STEP - size) / 2;
    this.sprites.forEach((sprite, i) => ctx.drawImage(sprite, left + i * SPRITE_STEP, SPRITES_TOP, size, size));

    drawPanel(ctx, STATS, won ? PALETTE.gold : PALETTE.darkSlate);
    const rows: [string, string][] = [
      ['LEVEL REACHED', `${level}/${LEVELS}`],
      ['ROOMS CLEARED', `${stats.rooms}`],
      ['FIGHTS WON', `${stats.fights}`],
      ['EPIC MONSTERS', `${stats.epics}`],
      ['BOSSES', `${stats.bosses}`],
      ['GOLD EARNED', `${stats.goldEarned}`],
      ['DAMAGE DONE', `${stats.damageDone}`],
      ['DAMAGE TAKEN', `${stats.damageTaken}`],
    ];
    rows.forEach(([label, value], i) => {
      const y = STATS.y + 8 + i * 12;
      drawText(ctx, label, STATS.x + 10, y, PALETTE.lightGray);
      drawText(ctx, value, STATS.x + STATS.w - 10 - textWidth(value), y, VALUE_COLOR[label] ?? PALETTE.white);
    });

    drawButton(ctx, TITLE_BUTTON, inside(this.game.input.pointer, TITLE_BUTTON));
  }
}
