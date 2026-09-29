import { describe, expect, it } from 'vitest';
import { BUFF_ICON, EQUIP_ICONS } from './icons';
import { TRANSPARENT, type SpriteDef } from './sprite';
import { SPRITES } from './sprites';

const ALL: Record<string, SpriteDef> = {
  ...SPRITES,
  ...Object.fromEntries(Object.entries(EQUIP_ICONS).map(([slot, def]) => [`icon:${slot}`, def])),
  'icon:buff': BUFF_ICON,
};

describe.each(Object.entries(ALL))('%s', (_name, def) => {
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
