import { PALETTE } from '../art/palette';
import { NATIVE_WIDTH } from '../engine/renderer';
import type { GameContext, Scene } from '../engine/scene';
import { completeNode } from '../run/flow';
import { drawBackground } from '../ui/background';
import { drawText, textWidth } from '../ui/font';
import { drawButton, drawPanel, inside, type Button } from '../ui/widgets';

const PANEL = { x: 120, y: 90, w: 240, h: 90 };
const CONTINUE: Button = { x: 180, y: 146, w: 120, h: 20, label: 'CONTINUE' };

// Stand-in for Store and Event nodes until Phase 5 builds them.
export class ComingSoonScene implements Scene {
  constructor(
    private game: GameContext,
    private kind: 'store' | 'event',
  ) {}

  enter(): void {
    this.game.input.consumeClicks();
  }

  update(): void {
    if (this.game.input.consumeClicks().some((c) => inside(c, CONTINUE))) completeNode(this.game);
  }

  render(ctx: CanvasRenderingContext2D): void {
    drawBackground(ctx);
    drawPanel(ctx, PANEL, PALETTE.darkSlate);
    const title = this.kind === 'store' ? 'STORE' : 'EVENT';
    drawText(ctx, title, (NATIVE_WIDTH - textWidth(title)) / 2, PANEL.y + 12, PALETTE.gold);
    const note = 'COMING IN PHASE 5';
    drawText(ctx, note, (NATIVE_WIDTH - textWidth(note)) / 2, PANEL.y + 30, PALETTE.lightGray);
    drawButton(ctx, CONTINUE, inside(this.game.input.pointer, CONTINUE));
  }
}
