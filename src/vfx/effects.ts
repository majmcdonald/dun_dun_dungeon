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
};
