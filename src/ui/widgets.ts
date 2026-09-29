import { PALETTE } from '../art/palette';
import { drawText, textWidth } from './font';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Button extends Rect {
  label: string;
}

export function inside(p: { x: number; y: number }, r: Rect): boolean {
  return p.x >= r.x && p.x < r.x + r.w && p.y >= r.y && p.y < r.y + r.h;
}

export function drawFrame(ctx: CanvasRenderingContext2D, r: Rect, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(r.x, r.y, r.w, 1);
  ctx.fillRect(r.x, r.y + r.h - 1, r.w, 1);
  ctx.fillRect(r.x, r.y, 1, r.h);
  ctx.fillRect(r.x + r.w - 1, r.y, 1, r.h);
}

export function drawPanel(ctx: CanvasRenderingContext2D, r: Rect, border: string): void {
  ctx.fillStyle = PALETTE.black;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  drawFrame(ctx, r, border);
}

export function drawButton(ctx: CanvasRenderingContext2D, b: Button, hover: boolean): void {
  drawPanel(ctx, b, hover ? PALETTE.gold : PALETTE.slate);
  const color = hover ? PALETTE.gold : PALETTE.white;
  drawText(ctx, b.label, b.x + (b.w - textWidth(b.label)) / 2, b.y + Math.floor((b.h - 7) / 2), color);
}
