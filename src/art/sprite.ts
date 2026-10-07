import { PALETTE, type PaletteColor } from './palette';

export const TRANSPARENT = '.';

export interface SpriteDef {
  width: number;
  height: number;
  legend: Record<string, PaletteColor>;
  frames: Record<string, string[]>;
}

export function spritePixels(def: SpriteDef, frame: string): Uint8ClampedArray<ArrayBuffer> {
  const rows = def.frames[frame];
  if (!rows) throw new Error(`Unknown frame: ${frame}`);
  const pixels = new Uint8ClampedArray(def.width * def.height * 4);
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === TRANSPARENT) continue;
      const hex = PALETTE[def.legend[ch]];
      const i = (y * def.width + x) * 4;
      pixels[i] = parseInt(hex.slice(1, 3), 16);
      pixels[i + 1] = parseInt(hex.slice(3, 5), 16);
      pixels[i + 2] = parseInt(hex.slice(5, 7), 16);
      pixels[i + 3] = 255;
    }
  });
  return pixels;
}

// A missing sprite (art not drawn yet) shows as a "?" box instead of crashing the frame.
export function spriteCanvas(def: SpriteDef | undefined, frame: string, flatColor?: PaletteColor): HTMLCanvasElement {
  if (!def) return placeholderCanvas();
  const pixels = spritePixels(def, frame);
  if (flatColor) {
    const hex = PALETTE[flatColor];
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] === 0) continue;
      pixels[i] = parseInt(hex.slice(1, 3), 16);
      pixels[i + 1] = parseInt(hex.slice(3, 5), 16);
      pixels[i + 2] = parseInt(hex.slice(5, 7), 16);
    }
  }
  const canvas = document.createElement('canvas');
  canvas.width = def.width;
  canvas.height = def.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.putImageData(new ImageData(pixels, def.width, def.height), 0, 0);
  return canvas;
}

const PLACEHOLDER_SIZE = 32;

function placeholderCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = PLACEHOLDER_SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = PALETTE.magenta;
  ctx.fillRect(6, 6, 20, 20);
  ctx.fillStyle = PALETTE.white;
  // A pixel "?".
  for (const [x, y, w, h] of [[12, 10, 8, 2], [18, 12, 2, 4], [14, 16, 4, 2], [14, 18, 2, 2], [14, 22, 2, 2]]) ctx.fillRect(x, y, w, h);
  return canvas;
}

// Draws a sprite into a box (32px by default), scaling larger sprites such as 48x48 bosses down to fit.
export function drawFitted(ctx: CanvasRenderingContext2D, img: HTMLCanvasElement, x: number, y: number, box = 32): void {
  const scale = Math.min(1, box / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const smoothing = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, x + (box - w) / 2, y + (box - h), w, h);
  ctx.imageSmoothingEnabled = smoothing;
}
