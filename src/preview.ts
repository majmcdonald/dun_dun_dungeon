import { PALETTE } from './art/palette';
import { spriteCanvas } from './art/sprite';
import { SPRITES } from './art/sprites';
import { Input } from './engine/input';
import { startLoop } from './engine/loop';
import { NATIVE_WIDTH, Renderer } from './engine/renderer';
import { drawText, textWidth } from './ui/font';

// Dev-only page for reviewing art before approval: idle and attack frames at 2x, 9 sprites per page.

const canvas = document.getElementById('game') as HTMLCanvasElement;
const renderer = new Renderer(canvas);
const input = new Input(canvas);
const ctx = renderer.ctx;

const REVIEW_ORDER = ['rogue', 'ranger', 'barbarian', 'paladin', 'necromancer', 'druid', 'monk', 'bard', 'warlock'];
const ids = [...REVIEW_ORDER, ...Object.keys(SPRITES).filter((id) => !REVIEW_ORDER.includes(id))];
const PAGE_TITLES = ['NEW - FOR REVIEW', 'APPROVED'];

const COLUMNS = 3;
const PER_PAGE = 9;
const SCALE = 2;
const CELL_W = NATIVE_WIDTH / COLUMNS;
const CELL_H = 84;

const entries = ids.map((id) => ({
  id,
  idle: spriteCanvas(SPRITES[id], 'idle'),
  attack: spriteCanvas(SPRITES[id], 'attack'),
}));
const pages = Math.ceil(entries.length / PER_PAGE);
let page = 0;

startLoop({
  update: () => {
    if (input.consumeClicks().length > 0) page = (page + 1) % pages;
  },
  render: () => {
    renderer.clear(PALETTE.darkBrown);
    entries.slice(page * PER_PAGE, (page + 1) * PER_PAGE).forEach((e, i) => {
      const x = (i % COLUMNS) * CELL_W + 12;
      const y = Math.floor(i / COLUMNS) * CELL_H + 4;
      ctx.drawImage(e.idle, x, y, 32 * SCALE, 32 * SCALE);
      ctx.drawImage(e.attack, x + 68, y, 32 * SCALE, 32 * SCALE);
      drawText(ctx, e.id, x, y + 66, PALETTE.sand);
    });
    const footer = `${PAGE_TITLES[page] ?? ''}  PAGE ${page + 1}/${pages}  CLICK FOR NEXT`;
    drawText(ctx, footer, NATIVE_WIDTH - textWidth(footer) - 6, 260, PALETTE.lightGray);
  },
});
