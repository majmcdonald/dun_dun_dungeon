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

export function spriteCanvas(def: SpriteDef, frame: string, flatColor?: PaletteColor): HTMLCanvasElement {
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
