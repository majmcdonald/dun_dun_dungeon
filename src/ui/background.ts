import { PALETTE } from '../art/palette';
import { seededRng } from '../engine/random';
import { NATIVE_HEIGHT, NATIVE_WIDTH } from '../engine/renderer';

export const WALL_H = 40;

interface Theme {
  floor: string;
  wall: string;
  mortar: string;
  edge: string;
  specks: string[];
  // Map paths not yet walked or offered: dark on light floors, light on dark ones.
  path: string;
  // How the wall band is drawn: running-bond bricks, irregular ice-rock blocks, or crypt stone with arches.
  wallStyle: 'brick' | 'ice' | 'crypt';
}

// One backdrop per act (0-based): the dungeon, the frozen wilds, the crypt. Only the colors and wall change,
// so every screen keeps its layout.
const THEMES: Theme[] = [
  {
    floor: PALETTE.darkBrown,
    wall: PALETTE.deepBrown,
    mortar: PALETTE.black,
    edge: PALETTE.brown,
    specks: [PALETTE.brown, PALETTE.brown, PALETTE.deepBrown, PALETTE.deepBrown, PALETTE.rust],
    path: PALETTE.black,
    wallStyle: 'brick',
  },
  {
    floor: PALETTE.darkSlate,
    wall: PALETTE.slate,
    mortar: PALETTE.night,
    edge: PALETTE.gray,
    specks: [PALETTE.slate, PALETTE.slate, PALETTE.night, PALETTE.gray, PALETTE.lightGray],
    path: PALETTE.night,
    wallStyle: 'ice',
  },
  {
    floor: PALETTE.night,
    wall: PALETTE.darkSlate,
    mortar: PALETTE.black,
    edge: PALETTE.plum,
    specks: [PALETTE.darkSlate, PALETTE.darkSlate, PALETTE.black, PALETTE.plum, PALETTE.sand],
    path: PALETTE.gray,
    wallStyle: 'crypt',
  },
];

function themeOf(act: number): Theme {
  return THEMES[Math.min(Math.max(act, 0), THEMES.length - 1)];
}

export function pathColor(act: number): string {
  return themeOf(act).path;
}

export function drawBackground(ctx: CanvasRenderingContext2D, act = 0): void {
  const theme = themeOf(act);
  ctx.fillStyle = theme.floor;
  ctx.fillRect(0, 0, NATIVE_WIDTH, NATIVE_HEIGHT);
  ctx.fillStyle = theme.wall;
  ctx.fillRect(0, 0, NATIVE_WIDTH, WALL_H);

  if (theme.wallStyle === 'brick') drawBricks(ctx, theme);
  else if (theme.wallStyle === 'ice') drawIce(ctx, theme);
  else drawCrypt(ctx, theme);

  ctx.fillStyle = theme.edge;
  ctx.fillRect(0, WALL_H, NATIVE_WIDTH, 1);
  if (theme.wallStyle === 'ice') drawIcicles(ctx);

  const specks = SPECKS[THEMES.indexOf(theme)];
  for (const s of specks) {
    ctx.fillStyle = s.color;
    ctx.fillRect(s.x, s.y, s.w, s.h);
  }
}

function drawBricks(ctx: CanvasRenderingContext2D, theme: Theme): void {
  ctx.fillStyle = theme.mortar;
  for (let y = 0; y < WALL_H; y += 10) {
    ctx.fillRect(0, y, NATIVE_WIDTH, 1);
    const offset = (y / 10) % 2 === 0 ? 0 : 12;
    for (let x = offset; x < NATIVE_WIDTH; x += 24) ctx.fillRect(x, y, 1, 10);
  }
}

// Irregular rock blocks with a lit top edge, frosted in places.
function drawIce(ctx: CanvasRenderingContext2D, theme: Theme): void {
  for (const b of ICE_BLOCKS) {
    ctx.fillStyle = theme.mortar;
    ctx.fillRect(b.x, b.y, b.w, 1);
    ctx.fillRect(b.x, b.y, 1, b.h);
    ctx.fillStyle = PALETTE.gray;
    ctx.fillRect(b.x + 1, b.y + 1, b.w - 1, 1);
    if (b.frost) {
      ctx.fillStyle = PALETTE.lightGray;
      ctx.fillRect(b.x + 2, b.y + 1, Math.max(2, Math.floor(b.w / 3)), 1);
    }
  }
}

function drawIcicles(ctx: CanvasRenderingContext2D): void {
  for (const i of ICICLES) {
    ctx.fillStyle = PALETTE.lightGray;
    ctx.fillRect(i.x, WALL_H + 1, 2, i.len);
    ctx.fillStyle = PALETTE.white;
    ctx.fillRect(i.x, WALL_H + 1, 1, Math.max(1, i.len - 2));
    ctx.fillStyle = PALETTE.cyan;
    ctx.fillRect(i.x, WALL_H + i.len + 1, 1, 1);
  }
}

// Large stone blocks with arched niches; a candle glows in some of them.
function drawCrypt(ctx: CanvasRenderingContext2D, theme: Theme): void {
  ctx.fillStyle = theme.mortar;
  for (let y = 0; y < WALL_H; y += 20) {
    ctx.fillRect(0, y, NATIVE_WIDTH, 1);
    const offset = (y / 20) % 2 === 0 ? 0 : 20;
    for (let x = offset; x < NATIVE_WIDTH; x += 40) ctx.fillRect(x, y, 1, 20);
  }
  for (let i = 0; i < NATIVE_WIDTH / ARCH_STEP; i++) {
    const x = ARCH_START + i * ARCH_STEP;
    ctx.fillStyle = PALETTE.black;
    ctx.fillRect(x, 12, 12, 24);
    ctx.fillRect(x + 2, 9, 8, 3);
    ctx.fillRect(x + 4, 7, 4, 2);
    ctx.fillStyle = PALETTE.plum;
    ctx.fillRect(x - 1, 12, 1, 24);
    ctx.fillRect(x + 12, 12, 1, 24);
    if (i % 2 === 0) {
      ctx.fillStyle = PALETTE.sand;
      ctx.fillRect(x + 5, 29, 2, 6);
      ctx.fillStyle = PALETTE.gold;
      ctx.fillRect(x + 5, 27, 2, 2);
      ctx.fillStyle = PALETTE.yellow;
      ctx.fillRect(x + 5, 26, 2, 1);
    }
  }
}

const ARCH_START = 14;
const ARCH_STEP = 60;

interface Speck {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

// Fixed seeds: scattered-looking detail that stays identical every frame.
const SPECKS: Speck[][] = THEMES.map((theme, t) => {
  const rng = seededRng(1337 + t * 101);
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
      color: theme.specks[Math.floor(rng() * theme.specks.length)],
    };
  });
});

const ICE_BLOCKS: { x: number; y: number; w: number; h: number; frost: boolean }[] = (() => {
  const rng = seededRng(4242);
  const blocks = [];
  for (let y = 0; y < WALL_H; ) {
    const h = 9 + Math.floor(rng() * 6);
    for (let x = -Math.floor(rng() * 20); x < NATIVE_WIDTH; ) {
      const w = 14 + Math.floor(rng() * 22);
      blocks.push({ x, y, w, h: Math.min(h, WALL_H - y), frost: rng() < 0.4 });
      x += w;
    }
    y += h;
  }
  return blocks;
})();

const ICICLES: { x: number; len: number }[] = (() => {
  const rng = seededRng(777);
  const out = [];
  for (let x = 4 + Math.floor(rng() * 10); x < NATIVE_WIDTH - 2; x += 9 + Math.floor(rng() * 18)) out.push({ x, len: 2 + Math.floor(rng() * 5) });
  return out;
})();
