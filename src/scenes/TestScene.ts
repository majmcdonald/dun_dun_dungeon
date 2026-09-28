import { NATIVE_HEIGHT, NATIVE_WIDTH } from '../engine/renderer';
import { clearSave, loadGame, saveGame } from '../engine/save';
import type { GameContext, Scene } from '../engine/scene';

interface DummySave {
  clicks: number;
}

const BUTTON = { x: 190, y: 120, w: 100, h: 30 };

export class TestScene implements Scene {
  private clicks = 0;
  private loadedFromSave = false;
  private elapsed = 0;

  constructor(private game: GameContext) {}

  enter(): void {
    const save = loadGame<DummySave>();
    this.loadedFromSave = save !== null;
    this.clicks = save?.clicks ?? 0;
  }

  update(dt: number): void {
    this.elapsed += dt;

    for (const click of this.game.input.consumeClicks()) {
      if (!inside(click, BUTTON)) continue;
      this.clicks++;
      saveGame<DummySave>({ clicks: this.clicks });
    }

    if (this.game.input.consumeKeys().has('KeyR')) {
      clearSave();
      this.clicks = 0;
      this.loadedFromSave = false;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.game.renderer.clear('#1a1c2c');

    ctx.fillStyle = '#f4f4f4';
    ctx.font = '8px monospace';
    ctx.textBaseline = 'top';
    ctx.fillText('PHASE 0 - ENGINE TEST', 8, 8);
    ctx.fillText(`native ${NATIVE_WIDTH}x${NATIVE_HEIGHT}  scale x${this.game.renderer.scale}`, 8, 20);
    ctx.fillText(`save loaded on boot: ${this.loadedFromSave ? 'yes' : 'no'}`, 8, 32);
    ctx.fillText('click button to increment + save; reload page to verify; R to clear', 8, 44);

    const hover = inside(this.game.input.pointer, BUTTON);
    ctx.fillStyle = hover ? '#41a6f6' : '#3b5dc9';
    ctx.fillRect(BUTTON.x, BUTTON.y, BUTTON.w, BUTTON.h);
    ctx.fillStyle = '#f4f4f4';
    ctx.fillText(`clicks: ${this.clicks}`, BUTTON.x + 22, BUTTON.y + 11);

    // Moving block proves the fixed-timestep loop is running.
    const x = Math.floor((Math.sin(this.elapsed * 2) * 0.5 + 0.5) * (NATIVE_WIDTH - 8));
    ctx.fillStyle = '#ef7d57';
    ctx.fillRect(x, NATIVE_HEIGHT - 16, 8, 8);
  }
}

function inside(p: { x: number; y: number }, r: { x: number; y: number; w: number; h: number }): boolean {
  return p.x >= r.x && p.x < r.x + r.w && p.y >= r.y && p.y < r.y + r.h;
}
