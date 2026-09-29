import type { SpriteDef } from '../sprite';
import { ARCHER_SPRITE } from './archer';
import { BAT_SPRITE } from './bat';
import { CLERIC_SPRITE } from './cleric';
import { KNIGHT_SPRITE } from './knight';
import { MAGE_SPRITE } from './mage';
import { ORC_SPRITE } from './orc';
import { SHAMAN_SPRITE } from './shaman';
import { SLIME_SPRITE } from './slime';

export const SPRITES: Record<string, SpriteDef> = {
  knight: KNIGHT_SPRITE,
  mage: MAGE_SPRITE,
  cleric: CLERIC_SPRITE,
  slime: SLIME_SPRITE,
  bat: BAT_SPRITE,
  archer: ARCHER_SPRITE,
  orc: ORC_SPRITE,
  shaman: SHAMAN_SPRITE,
};
