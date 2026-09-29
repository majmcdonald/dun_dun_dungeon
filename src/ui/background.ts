import { PALETTE } from '../art/palette';
import { seededRng } from '../engine/random';
import { NATIVE_HEIGHT, NATIVE_WIDTH } from '../engine/renderer';

export const WALL_H = 40;

export function drawBackground(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = PALETTE.darkBrown;
  ctx.fillRect(0, 0, NATIVE_WIDTH, NATIVE_HEIGHT);

  ctx.fillStyle = PALETTE.deepBrown;
  ctx.fillRect(0, 0, NATIVE_WIDTH, WALL_H);
  ctx.fillStyle = PALETTE.black;
  for (let y = 0; y < WALL_H; y += 10) {
    ctx.fillRect(0, y, NATIVE_WIDTH, 1);
    const offset = (y / 10) % 2 === 0 ? 0 : 12;
    for (let x = offset; x < NATIVE_WIDTH; x += 24) ctx.fillRect(x, y, 1, 10);
  }
  ctx.fillStyle = PALETTE.brown;
  ctx.fillRect(0, WALL_H, NATIVE_WIDTH, 1);

  for (const s of DIRT_SPECKS) {
    ctx.fillStyle = s.color;
    ctx.fillRect(s.x, s.y, s.w, s.h);
  }
}

interface Speck {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

// Fixed seed: scattered-looking dirt that stays identical every frame.
const DIRT_SPECKS: Speck[] = (() => {
  const rng = seededRng(1337);
  const colors = [PALETTE.brown, PALETTE.brown, PALETTE.deepBrown, PALETTE.deepBrown, PALETTE.rust];
  const sizes = [
    [1, 1],
    [1, 1],
    [2, 1],
    [1, 2],
    [2, 2],
  ];
  return Array.from({ length: 160 }, () => {
    const [w, h] = sizes[Math.floor(rng() * sizes.length)];
    return {
      x: Math.floor(rng() * NATIVE_WIDTH),
      y: WALL_H + 3 + Math.floor(rng() * (NATIVE_HEIGHT - WALL_H - 5)),
      w,
      h,
      color: colors[Math.floor(rng() * colors.length)],
    };
  });
})();
