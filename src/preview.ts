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

const REVIEW_ORDER = ['goblinKing', 'slimeKing', 'troll'];
const ids = [...REVIEW_ORDER, ...Object.keys(SPRITES).filter((id) => !REVIEW_ORDER.includes(id))];
const PAGE_TITLES = ['NEW - FOR REVIEW'];

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
      // 32x32 sprites at 2x; the 48x48 bosses at 1x so they fit the cell.
      const size = e.idle.width === 32 ? 32 * SCALE : e.idle.width;
      ctx.drawImage(e.idle, x, y + 64 - size, size, size);
      ctx.drawImage(e.attack, x + 68, y + 64 - size, size, size);
      drawText(ctx, e.id, x, y + 66, PALETTE.sand);
    });
    const footer = `${PAGE_TITLES[page] ?? ''}  PAGE ${page + 1}/${pages}  CLICK FOR NEXT`;
    drawText(ctx, footer, NATIVE_WIDTH - textWidth(footer) - 6, 260, PALETTE.lightGray);
  },
});
