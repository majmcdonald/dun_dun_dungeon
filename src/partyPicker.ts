import { PALETTE } from './art/palette';
import { spriteCanvas } from './art/sprite';
import { SPRITES } from './art/sprites';
import { CLASSES } from './content/classes';
import { Input } from './engine/input';
import { startLoop } from './engine/loop';
import { NATIVE_WIDTH, Renderer } from './engine/renderer';
import { drawText, textWidth } from './ui/font';
import { drawButton, drawPanel, inside, type Button, type Rect } from './ui/widgets';

// Dev-only page: pick up to 3 classes, then open the game with ?party= set to them in pick order.

const canvas = document.getElementById('game') as HTMLCanvasElement;
const renderer = new Renderer(canvas);
const input = new Input(canvas);
const ctx = renderer.ctx;

const COLUMNS = 6;
const CELL_W = NATIVE_WIDTH / COLUMNS;
const CELL_H = 104;
const GRID_TOP = 24;
const SCALE = 2;
const PARTY_SIZE = 3;

const cells = CLASSES.map((def, i) => ({
  def,
  sprite: spriteCanvas(SPRITES[def.id], 'idle'),
  rect: { x: (i % COLUMNS) * CELL_W + 2, y: GRID_TOP + Math.floor(i / COLUMNS) * CELL_H, w: CELL_W - 4, h: CELL_H - 4 } as Rect,
}));
const fight: Button = { x: NATIVE_WIDTH - 110, y: 238, w: 100, h: 20, label: 'FIGHT' };
const picked: string[] = [];

startLoop({
  update: () => {
    for (const click of input.consumeClicks()) {
      if (picked.length > 0 && inside(click, fight)) {
        location.href = `/?party=${picked.join(',')}`;
        return;
      }
      const cell = cells.find((c) => inside(click, c.rect));
      if (!cell) continue;
      const index = picked.indexOf(cell.def.id);
      if (index >= 0) picked.splice(index, 1);
      else if (picked.length < PARTY_SIZE) picked.push(cell.def.id);
    }
  },
  render: () => {
    renderer.clear(PALETTE.darkBrown);
    const title = 'PICK YOUR PARTY';
    drawText(ctx, title, (NATIVE_WIDTH - textWidth(title)) / 2, 8, PALETTE.sand);

    const pointer = input.pointer;
    for (const c of cells) {
      const order = picked.indexOf(c.def.id);
      const hover = inside(pointer, c.rect);
      drawPanel(ctx, c.rect, order >= 0 ? PALETTE.gold : hover ? PALETTE.lightGray : PALETTE.darkSlate);
      ctx.drawImage(c.sprite, c.rect.x + (c.rect.w - 32 * SCALE) / 2, c.rect.y + 8, 32 * SCALE, 32 * SCALE);
      const name = c.def.name.toUpperCase();
      drawText(ctx, name, c.rect.x + (c.rect.w - textWidth(name)) / 2, c.rect.y + 80, order >= 0 ? PALETTE.gold : PALETTE.white);
      if (order >= 0) drawText(ctx, `${order + 1}`, c.rect.x + 4, c.rect.y + 4, PALETTE.gold);
    }

    const summary = picked.length > 0 ? picked.map((id) => id.toUpperCase()).join('  ') : 'CLICK UP TO 3 CLASSES';
    drawText(ctx, summary, 10, 245, picked.length > 0 ? PALETTE.white : PALETTE.gray);
    if (picked.length > 0) drawButton(ctx, fight, inside(pointer, fight));
  },
});
