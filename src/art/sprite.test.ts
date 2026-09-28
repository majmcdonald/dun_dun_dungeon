import { describe, expect, it } from 'vitest';
import { TRANSPARENT } from './sprite';
import { SPRITES } from './sprites';

describe.each(Object.entries(SPRITES))('%s sprite', (_name, def) => {
  it.each(Object.keys(def.frames))('frame "%s" matches declared size and legend', (frame) => {
    const rows = def.frames[frame];
    expect(rows).toHaveLength(def.height);
    rows.forEach((row, y) => {
      expect(row.length, `row ${y} width`).toBe(def.width);
      for (const ch of row) {
        if (ch !== TRANSPARENT) expect(def.legend, `row ${y} char "${ch}"`).toHaveProperty(ch);
      }
    });
  });
});
