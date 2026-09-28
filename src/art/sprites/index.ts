import type { SpriteDef } from '../sprite';
import { SLIME_SPRITE } from './slime';
import { KNIGHT_SPRITE } from './knight';

export const SPRITES: Record<string, SpriteDef> = {
  knight: KNIGHT_SPRITE,
  slime: SLIME_SPRITE,
};
