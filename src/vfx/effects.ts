import { PALETTE } from '../art/palette';
import { seededRng } from '../engine/random';

export interface VfxDef {
  duration: number;
  // t runs 0→1 over the effect; (cx, cy) is the target sprite's visual center.
  draw(ctx: CanvasRenderingContext2D, t: number, cx: number, cy: number, seed: number): void;
}

function px(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w = 1, h = 1): void {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

function ramp(colors: string[], t: number): string {
  return colors[Math.min(colors.length - 1, Math.floor(t * colors.length))];
}

const FIRE = [PALETTE.white, PALETTE.yellow, PALETTE.gold, PALETTE.orange, PALETTE.red, PALETTE.darkRed];

// Damage-over-time tick colors by element; 'none' covers plain bleeds.
const DOT_COLORS = {
  none: [PALETTE.red, PALETTE.darkRed],
  fire: [PALETTE.orange, PALETTE.red],
  ice: [PALETTE.cyan, PALETTE.blue],
  lightning: [PALETTE.yellow, PALETTE.gold],
  holy: [PALETTE.yellow, PALETTE.sand],
  shadow: [PALETTE.magenta, PALETTE.plum],
  poison: [PALETTE.green, PALETTE.midGreen],
};

export const DOT_TIERS = 3;
// A tick's share of the target's max HP that reaches tiers 2 and 3.
const DOT_TIER_SHARE = [0.05, 0.25];

// Damage over time: bubbles pop up off the target in the element's colors. Higher tiers send up more and bigger
// bubbles, higher; tier 3 adds a bright flash at the core.
function dotVfx([light, dark]: string[], tier: number): VfxDef {
  const count = [4, 8, 13][tier - 1];
  const rise = [14, 20, 26][tier - 1];
  const spread = [14, 20, 24][tier - 1];
  const big = tier;
  return {
    duration: [0.45, 0.55, 0.65][tier - 1],
    draw(ctx, t, cx, cy, seed) {
      const rng = seededRng(seed);
      if (tier === 3 && t < 0.3) {
        const size = Math.round(10 * (1 - t / 0.3)) + 2;
        px(ctx, t < 0.12 ? PALETTE.white : light, cx - size / 2, cy - size / 2, size, size);
      }
      if (tier >= 2 && t < 0.4) {
        const r = 4 + (t / 0.4) * (tier === 3 ? 14 : 10);
        for (let i = 0; i < 12; i++) {
          const angle = (i / 12) * Math.PI * 2;
          px(ctx, light, cx + Math.cos(angle) * r, cy + Math.sin(angle) * r * 0.6);
        }
      }
      for (let i = 0; i < count; i++) {
        const delay = rng() * 0.3;
        const local = (t - delay) / (1 - delay);
        if (local <= 0 || local >= 1) continue;
        const x = cx - spread / 2 + rng() * spread;
        const y = cy + 2 - local * rise;
        const size = local < 0.6 ? big + (rng() < 0.3 ? 1 : 0) : Math.max(1, big - 1);
        px(ctx, local < 0.5 ? light : dark, x - size / 2, y - size / 2, size, size);
      }
    },
  };
}

// Which VFX a damage-over-time tick plays: its element's colors, at a tier set by how hard it hit.
export function dotVfxId(element: string | undefined, amount: number, maxHp: number): string {
  const share = amount / Math.max(1, maxHp);
  const tier = 1 + DOT_TIER_SHARE.filter((s) => share >= s).length;
  return `dot:${element && element in DOT_COLORS ? element : 'none'}:${tier}`;
}

export const VFX: Record<string, VfxDef> = {
  // Burst: a hot core that collapses while a ring of embers flies outward and cools.
  fireball: {
    duration: 0.45,
    draw(ctx, t, cx, cy, seed) {
      const rng = seededRng(seed);
      if (t < 0.35) {
        const core = t < 0.15 ? 3 : 2;
        px(ctx, t < 0.15 ? PALETTE.white : PALETTE.yellow, cx - core, cy - core, core * 2, core * 2);
      }
      for (let i = 0; i < 14; i++) {
        const angle = (i / 14) * Math.PI * 2 + rng() * 0.4;
        const speed = 10 + rng() * 6;
        const r = 2 + t * speed;
        const size = t < 0.5 ? 2 : 1;
        px(ctx, ramp(FIRE, t + rng() * 0.15), cx + Math.cos(angle) * r, cy + Math.sin(angle) * r * 0.8, size, size);
      }
    },
  },
  // Green plus-shaped sparkles drifting upward from the target.
  heal: {
    duration: 0.7,
    draw(ctx, t, cx, cy, seed) {
      const rng = seededRng(seed);
      for (let i = 0; i < 6; i++) {
        const delay = rng() * 0.35;
        const local = (t - delay) / (1 - delay);
        const ox = -10 + rng() * 20;
        const oy = -4 + rng() * 14;
        if (local <= 0 || local >= 1) continue;
        const x = cx + ox;
        const y = cy + oy - local * 14;
        const color = local < 0.6 ? PALETTE.green : PALETTE.midGreen;
        px(ctx, local < 0.3 ? PALETTE.white : color, x, y);
        px(ctx, color, x - 1, y);
        px(ctx, color, x + 1, y);
        px(ctx, color, x, y - 1);
        px(ctx, color, x, y + 1);
      }
    },
  },
  // Gold motes rising around the target inside a brief pair of light pillars.
  blessing: {
    duration: 0.8,
    draw(ctx, t, cx, cy, seed) {
      const rng = seededRng(seed);
      if (t < 0.5) {
        const color = t < 0.25 ? PALETTE.yellow : PALETTE.gold;
        const top = cy - 18 + t * 10;
        px(ctx, color, cx - 11, top, 1, 30 - t * 20);
        px(ctx, color, cx + 10, top, 1, 30 - t * 20);
      }
      for (let i = 0; i < 10; i++) {
        const delay = rng() * 0.4;
        const local = (t - delay) / (1 - delay);
        const ox = -9 + rng() * 18;
        if (local <= 0 || local >= 1) continue;
        const y = cy + 14 - local * 26;
        px(ctx, local < 0.5 ? PALETTE.yellow : PALETTE.gold, cx + ox, y, 1, 2);
      }
    },
  },
  // Summon: sparks spiral in from a wide ring, then a white flash marks the arrival.
  summon: {
    duration: 0.6,
    draw(ctx, t, cx, cy, seed) {
      const rng = seededRng(seed);
      if (t < 0.75) {
        const local = t / 0.75;
        for (let i = 0; i < 12; i++) {
          const angle = (i / 12) * Math.PI * 2 + local * 3 + rng() * 0.3;
          const r = 18 * (1 - local) + 2;
          px(ctx, i % 2 ? PALETTE.magenta : PALETTE.white, cx + Math.cos(angle) * r, cy + Math.sin(angle) * r * 0.8, 2, 2);
        }
        return;
      }
      const flash = (t - 0.75) / 0.25;
      const size = Math.round(8 * (1 - flash)) + 2;
      px(ctx, flash < 0.5 ? PALETTE.white : PALETTE.magenta, cx - size / 2, cy - size / 2, size, size);
    },
  },
  // Transform: a gray smoke poof with a few magenta sparks.
  transform: {
    duration: 0.55,
    draw(ctx, t, cx, cy, seed) {
      const rng = seededRng(seed);
      for (let i = 0; i < 9; i++) {
        const angle = rng() * Math.PI * 2;
        const r = 3 + t * (8 + rng() * 6);
        const size = Math.max(1, Math.round(5 - t * 4 + rng()));
        const color = t < 0.3 ? PALETTE.white : t < 0.65 ? PALETTE.lightGray : PALETTE.gray;
        px(ctx, color, cx + Math.cos(angle) * r - size / 2, cy + Math.sin(angle) * r * 0.7 - size / 2 - t * 4, size, size);
      }
      for (let i = 0; i < 5; i++) {
        const angle = rng() * Math.PI * 2;
        const r = 4 + t * 16;
        if (t > 0.2) px(ctx, PALETTE.magenta, cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
      }
    },
  },
  // Shapeshift: green leaves spiral up and around the druid.
  shapeshift: {
    duration: 0.7,
    draw(ctx, t, cx, cy, seed) {
      const rng = seededRng(seed);
      for (let i = 0; i < 10; i++) {
        const delay = rng() * 0.3;
        const local = (t - delay) / (1 - delay);
        if (local <= 0 || local >= 1) continue;
        const angle = (i / 10) * Math.PI * 2 + local * 6;
        const x = cx + Math.cos(angle) * 11;
        const y = cy + 14 - local * 30;
        const front = Math.sin(angle) > 0;
        px(ctx, front ? PALETTE.green : PALETTE.midGreen, x, y, 2, 1);
        px(ctx, PALETTE.darkGreen, x + (front ? 1 : 0), y + 1);
      }
    },
  },
  // Slow: blue drops sink past the target and a cyan ring tightens.
  slow: {
    duration: 0.55,
    draw(ctx, t, cx, cy, seed) {
      const rng = seededRng(seed);
      for (let i = 0; i < 7; i++) {
        const x = cx - 10 + rng() * 20;
        const y = cy - 14 + rng() * 8 + t * 22;
        px(ctx, PALETTE.blue, x, y, 1, 3);
        px(ctx, PALETTE.cyan, x, y + 3);
      }
      const r = 16 * (1 - t) + 4;
      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        px(ctx, PALETTE.cyan, cx + Math.cos(angle) * r, cy + 10 + Math.sin(angle) * r * 0.3);
      }
    },
  },
  // Haste: yellow speed lines streak past the target.
  haste: {
    duration: 0.4,
    draw(ctx, t, cx, cy, seed) {
      const rng = seededRng(seed);
      for (let i = 0; i < 7; i++) {
        const y = cy - 12 + rng() * 24;
        const len = 6 + rng() * 6;
        const x = cx + 16 - t * 40 - rng() * 8;
        px(ctx, i % 2 ? PALETTE.yellow : PALETTE.white, x, y, len, 1);
      }
    },
  },
  // Chaos: sparks in every color burst out at random.
  chaos: {
    duration: 0.5,
    draw(ctx, t, cx, cy, seed) {
      const rng = seededRng(seed);
      const colors = [PALETTE.red, PALETTE.orange, PALETTE.yellow, PALETTE.green, PALETTE.cyan, PALETTE.blue, PALETTE.magenta];
      for (let i = 0; i < 16; i++) {
        const angle = rng() * Math.PI * 2;
        const r = 2 + t * (8 + rng() * 12);
        const color = colors[Math.floor(rng() * colors.length + t * 7) % colors.length];
        px(ctx, color, cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, t < 0.5 ? 2 : 1, t < 0.5 ? 2 : 1);
      }
    },
  },
  ...Object.fromEntries(
    (Object.keys(DOT_COLORS) as (keyof typeof DOT_COLORS)[]).flatMap((key) =>
      [1, 2, 3].map((tier) => [`dot:${key}:${tier}`, dotVfx(DOT_COLORS[key], tier)]),
    ),
  ),
};
