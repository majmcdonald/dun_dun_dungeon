import type { SpriteDef } from '../sprite';
import { ARCHER_SPRITE } from './archer';
import { BARBARIAN_SPRITE } from './barbarian';
import { BARD_SPRITE } from './bard';
import { BAT_SPRITE } from './bat';
import { CLERIC_SPRITE } from './cleric';
import { DRUID_SPRITE } from './druid';
import { KNIGHT_SPRITE } from './knight';
import { MAGE_SPRITE } from './mage';
import { MONK_SPRITE } from './monk';
import { NECROMANCER_SPRITE } from './necromancer';
import { ORC_SPRITE } from './orc';
import { PALADIN_SPRITE } from './paladin';
import { RANGER_SPRITE } from './ranger';
import { ROGUE_SPRITE } from './rogue';
import { SHAMAN_SPRITE } from './shaman';
import { SLIME_SPRITE } from './slime';
import { WARLOCK_SPRITE } from './warlock';

export const SPRITES: Record<string, SpriteDef> = {
  knight: KNIGHT_SPRITE,
  mage: MAGE_SPRITE,
  cleric: CLERIC_SPRITE,
  rogue: ROGUE_SPRITE,
  ranger: RANGER_SPRITE,
  barbarian: BARBARIAN_SPRITE,
  paladin: PALADIN_SPRITE,
  necromancer: NECROMANCER_SPRITE,
  druid: DRUID_SPRITE,
  monk: MONK_SPRITE,
  bard: BARD_SPRITE,
  warlock: WARLOCK_SPRITE,
  slime: SLIME_SPRITE,
  bat: BAT_SPRITE,
  archer: ARCHER_SPRITE,
  orc: ORC_SPRITE,
  shaman: SHAMAN_SPRITE,
};
