import { PALETTE } from '../art/palette';
import { spriteCanvas } from '../art/sprite';
import { TITLE_ART } from '../art/titleArt';
import { NATIVE_WIDTH } from '../engine/renderer';
import type { GameContext, Scene } from '../engine/scene';
import { drawBackground } from '../ui/background';
import { drawText, textWidth } from '../ui/font';
import { TitleScene } from './TitleScene';

const TITLE = 'DUN-DUN-DUNGEON';
const TITLE_SCALE = 3;
const ART_Y = 40;
const PROMPT = 'CLICK TO START';
const PROMPT_Y = 250;
const BLINK = 0.6;

// The game's opening screen: the title and the party heading into the dungeon. Any click goes to profile select.
export class SplashScene implements Scene {
  private art = spriteCanvas(TITLE_ART, 'idle');
  private time = 0;

  constructor(private game: GameContext) {}

  enter(): void {
    this.game.input.consumeClicks();
  }

  update(dt: number): void {
    this.time += dt;
    if (this.game.input.consumeClicks().length > 0) this.game.scenes.switchTo(new TitleScene(this.game));
  }

  render(ctx: CanvasRenderingContext2D): void {
    drawBackground(ctx);
    const w = textWidth(TITLE, TITLE_SCALE);
    drawText(ctx, TITLE, (NATIVE_WIDTH - w) / 2, 10, PALETTE.gold, PALETTE.black, TITLE_SCALE);
    ctx.fillStyle = PALETTE.black;
    ctx.fillRect((NATIVE_WIDTH - TITLE_ART.width) / 2 - 2, ART_Y - 2, TITLE_ART.width + 4, TITLE_ART.height + 4);
    ctx.drawImage(this.art, (NATIVE_WIDTH - TITLE_ART.width) / 2, ART_Y);
    if (Math.floor(this.time / BLINK) % 2 === 0) drawText(ctx, PROMPT, (NATIVE_WIDTH - textWidth(PROMPT)) / 2, PROMPT_Y, PALETTE.sand);
  }
}
