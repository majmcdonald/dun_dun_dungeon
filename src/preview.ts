import { PALETTE } from './art/palette';
import { spriteCanvas } from './art/sprite';
import { SPRITES } from './art/sprites';
import { startLoop } from './engine/loop';
import { NATIVE_WIDTH, Renderer } from './engine/renderer';
import { drawText } from './ui/font';

// Dev-only page for reviewing art before approval: every sprite's idle and attack frame at 2x.

const renderer = new Renderer(document.getElementById('game') as HTMLCanvasElement);
const ctx = renderer.ctx;

const COLUMNS = 3;
const SCALE = 2;
const CELL_W = NATIVE_WIDTH / COLUMNS;
const CELL_H = 84;

const entries = Object.entries(SPRITES).map(([id, def]) => ({
  id,
  idle: spriteCanvas(def, 'idle'),
  attack: spriteCanvas(def, 'attack'),
}));

startLoop({
  update: () => {},
  render: () => {
    renderer.clear(PALETTE.darkBrown);
    entries.forEach((e, i) => {
      const x = (i % COLUMNS) * CELL_W + 12;
      const y = Math.floor(i / COLUMNS) * CELL_H + 6;
      ctx.drawImage(e.idle, x, y, 32 * SCALE, 32 * SCALE);
      ctx.drawImage(e.attack, x + 68, y, 32 * SCALE, 32 * SCALE);
      drawText(ctx, e.id, x, y + 66, PALETTE.sand);
    });
  },
});
