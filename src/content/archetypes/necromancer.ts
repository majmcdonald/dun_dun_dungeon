import type { SkillDef, Targeting } from '../../combat/types';
import {
  barrier,
  buff,
  cls,
  debuff,
  delay,
  dmg,
  dot,
  foe,
  haste,
  meter,
  SELF,
  self,
  selfDamage,
  skill,
  slow,
  summon,
  type SkillSpec,
} from '../build';

type Spec = Omit<SkillSpec, 'access' | 'category'> & { category?: SkillSpec['category'] };
const n = (spec: Spec): SkillDef => skill({ category: 'spell', ...spec, access: cls('necromancer') });

const MY_DEAD: Targeting = { side: 'summons', area: 'all' };
const souls = (cost: number) => ({ kind: 'souls', cost }) as const;
const shadow = (extra: object = {}) => ({ type: 'magic', element: 'shadow', ...extra }) as const;

// Raise: call the dead to fight; the strongest raisings spend souls.
const raise: SkillDef[] = [
  n({ id: 'raiseSkeleton', name: 'Raise Skeleton', theme: 'raise', rarity: 'common', cooldown: 10, target: SELF, fx: [summon('skeleton')] }),
  n({ id: 'raiseZombie', name: 'Raise Zombie', theme: 'raise', rarity: 'common', cooldown: 12, target: SELF, fx: [summon('zombie')] }),
  n({ id: 'boneArmor', name: 'Bone Armor', theme: 'raise', rarity: 'common', cooldown: 6, target: MY_DEAD, fx: [barrier(1, 4, 'resistance')] }),
  n({ id: 'armyOfTheDead', name: 'Army of the Dead', theme: 'raise', rarity: 'rare', cooldown: 8, condition: souls(2), target: SELF, fx: [summon('skeleton', 0.5), summon('zombie', 0.5)] }),
  n({ id: 'raiseWraith', name: 'Raise Wraith', theme: 'raise', rarity: 'rare', cooldown: 8, condition: souls(1), target: SELF, fx: [summon('wraith')], synergy: { with: 'raiseSkeleton', bonus: 0.3 } }),
  n({ id: 'unholyFrenzy', name: 'Unholy Frenzy', theme: 'raise', rarity: 'epic', cooldown: 8, target: MY_DEAD, fx: [buff('attack', 0.5, 5), haste(0.5, 5)] }),
  n({ id: 'lichLord', name: 'Lich Lord', theme: 'raise', rarity: 'legendary', cooldown: 10, condition: souls(3), target: SELF, fx: [summon('wraith', 0.5), summon('skeleton', 0.5)], prerequisite: 'raiseSkeleton' }),
];

// Fear: break the enemy's rhythm.
const fear: SkillDef[] = [
  n({ id: 'terrify', name: 'Terrify', theme: 'fear', rarity: 'common', cooldown: 5, target: foe('front'), fx: [delay(1)] }),
  n({ id: 'dread', name: 'Dread', theme: 'fear', rarity: 'common', cooldown: 5, target: foe('highestHp'), fx: [debuff('attack', 0.8, 5), self(meter(0.2))] }),
  n({ id: 'howlOfTerror', name: 'Howl of Terror', theme: 'fear', rarity: 'common', cooldown: 7, target: foe('front', 'column'), fx: [slow(1, 4)] }),
  n({ id: 'nightmare', name: 'Nightmare', theme: 'fear', rarity: 'rare', cooldown: 4, target: foe('random'), fx: [delay(0.5), dmg(0.5, shadow())], synergy: { with: 'terrify', bonus: 0.3 } }),
  n({ id: 'horrify', name: 'Horrify', theme: 'fear', rarity: 'rare', cooldown: 8, target: foe('front', 'all'), fx: [debuff('attack', 1, 5)] }),
  n({ id: 'paralyzingFear', name: 'Paralyzing Fear', theme: 'fear', rarity: 'epic', cooldown: 9, target: foe('front', 'column'), fx: [delay(1)] }),
];

// Death: feed on souls and life.
const death: SkillDef[] = [
  n({ id: 'soulRend', name: 'Soul Rend', theme: 'death', rarity: 'common', cooldown: 3, condition: souls(1), target: foe('lowestHp'), fx: [dmg(1, shadow())] }),
  n({ id: 'deathCoil', name: 'Death Coil', theme: 'death', rarity: 'common', cooldown: 3, target: foe('front'), fx: [dmg(1, shadow({ drain: 0.5 }))] }),
  n({ id: 'wither', name: 'Wither', theme: 'death', rarity: 'common', cooldown: 5, target: foe('highestHp'), fx: [dot(1, 5, { stat: 'magic', element: 'shadow' })] }),
  n({ id: 'reap', name: 'Reap', theme: 'death', rarity: 'rare', cooldown: 4, condition: souls(1), target: foe('front', 'column'), fx: [dmg(1, shadow())] }),
  n({ id: 'soulBurst', name: 'Soul Burst', theme: 'death', rarity: 'rare', cooldown: 5, condition: souls(2), target: foe('front', 'all'), fx: [dmg(1, shadow())], synergy: { with: 'soulRend', bonus: 0.3 } }),
  n({ id: 'deathsEmbrace', name: "Death's Embrace", theme: 'death', rarity: 'epic', cooldown: 5, condition: souls(2), target: foe('lowestHpPct'), fx: [dmg(1, shadow({ drain: 0.5 }))] }),
  n({ id: 'soulStorm', name: 'Soul Storm', theme: 'death', rarity: 'epic', cooldown: 7, condition: souls(2), target: foe('front', 'all'), fx: [dmg(0.7, shadow()), delay(0.3)] }),
  n({ id: 'doomToll', name: 'Doom Toll', theme: 'death', rarity: 'legendary', cooldown: 8, condition: souls(3), target: foe('front', 'all'), fx: [dmg(1, shadow())], prerequisite: 'soulRend' }),
];

const general: SkillDef[] = [
  n({ id: 'corpseExplosion', name: 'Corpse Explosion', theme: 'necromancer', rarity: 'rare', cooldown: 4, condition: souls(1), target: foe('front', 'row'), fx: [dmg(1, { type: 'magic' })] }),
  n({ id: 'soulShield', name: 'Soul Shield', theme: 'necromancer', rarity: 'rare', cooldown: 5, condition: souls(1), target: SELF, fx: [barrier(1, 4, 'resistance')] }),
  n({ id: 'graveChill', name: 'Grave Chill', theme: 'necromancer', rarity: 'common', cooldown: 3, target: foe('front'), fx: [dmg(0.6, { type: 'magic', element: 'ice' }), slow(0.4, 3)] }),
  n({ id: 'darkPact', name: 'Dark Pact', theme: 'necromancer', rarity: 'common', cooldown: 6, target: SELF, fx: [selfDamage(0.06), buff('magic', 1.1, 5)] }),
];

export const NECROMANCER_ARCHETYPES: SkillDef[] = [...raise, ...fear, ...death, ...general];
