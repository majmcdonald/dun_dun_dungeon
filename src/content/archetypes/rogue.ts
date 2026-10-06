import type { SkillDef } from '../../combat/types';
import {
  barrier,
  buff,
  cls,
  debuff,
  delay,
  dmg,
  dot,
  foe,
  gold,
  haste,
  SELF,
  self,
  selfDamage,
  siphon,
  skill,
  steal,
  taunt,
  type SkillSpec,
} from '../build';

type Spec = Omit<SkillSpec, 'access' | 'category'> & { category?: SkillSpec['category'] };
const r = (spec: Spec): SkillDef => skill({ category: 'skill', ...spec, access: cls('rogue') });

const shadow = { element: 'shadow' } as const;

// Swashbuckler: daring attacks that leave the rogue exposed.
const swashbuckler: SkillDef[] = [
  r({ id: 'lunge', name: 'Lunge', theme: 'swashbuckler', rarity: 'common', cooldown: 2, target: foe('front'), fx: [dmg(1.25), self(debuff('defense', 0.25, 3))] }),
  r({ id: 'flourish', name: 'Flourish', theme: 'swashbuckler', rarity: 'common', cooldown: 2.5, target: foe('random'), fx: [dmg(1, { hits: 2 })] }),
  r({ id: 'daringStrike', name: 'Daring Strike', theme: 'swashbuckler', rarity: 'common', cooldown: 2.5, target: foe('highestHp'), fx: [dmg(1.15), selfDamage(0.04)] }),
  r({ id: 'danceOfBlades', name: 'Dance of Blades', theme: 'swashbuckler', rarity: 'rare', cooldown: 3, target: foe('front'), fx: [dmg(1.25, { hits: 3 }), self(debuff('defense', 0.25, 3))], synergy: { with: 'flourish', bonus: 0.3 } }),
  r({ id: 'bravado', name: 'Bravado', theme: 'swashbuckler', rarity: 'rare', cooldown: 7, target: SELF, fx: [buff('attack', 1.25, 5), self(debuff('defense', 0.25, 5))] }),
  r({ id: 'deathSpiral', name: 'Death Spiral', theme: 'swashbuckler', rarity: 'epic', cooldown: 6, target: foe('front', 'all'), fx: [dmg(1.05), selfDamage(0.05)] }),
  r({ id: 'blazeOfGlory', name: 'Blaze of Glory', theme: 'swashbuckler', rarity: 'legendary', cooldown: 5, target: foe('lowestHp'), fx: [dmg(1.2, { hits: 3 }), self(debuff('defense', 0.2, 4))], prerequisite: 'lunge' }),
];

// Assassin: slow, silent, and deadly.
const assassin: SkillDef[] = [
  r({ id: 'garrote', name: 'Garrote', theme: 'assassin', rarity: 'common', cooldown: 4, target: foe('back'), fx: [dmg(0.6), dot(0.4, 4)] }),
  r({ id: 'ambush', name: 'Ambush', theme: 'assassin', rarity: 'common', cooldown: 4, target: foe('castSpell'), fx: [dmg(1, shadow)] }),
  r({ id: 'markForDeath', name: 'Mark for Death', theme: 'assassin', rarity: 'common', cooldown: 6, target: foe('highestHp'), fx: [debuff('defense', 1, 5)] }),
  r({ id: 'silentKill', name: 'Silent Kill', theme: 'assassin', rarity: 'rare', cooldown: 6, target: foe('lowestHp'), fx: [dmg(1, shadow)], synergy: { with: 'markForDeath', bonus: 0.3 } }),
  r({ id: 'shadowCloak', name: 'Shadow Cloak', theme: 'assassin', rarity: 'rare', cooldown: 6, target: SELF, fx: [barrier(0.7, 4), haste(0.3, 4)] }),
  r({ id: 'coupDeGrace', name: 'Coup de Grace', theme: 'assassin', rarity: 'epic', cooldown: 8, target: foe('lowestHpPct'), fx: [dmg(1, shadow)] }),
  r({ id: 'nightfall', name: 'Nightfall', theme: 'assassin', rarity: 'epic', cooldown: 9, target: foe('front', 'all'), fx: [dot(1, 5, { element: 'shadow' })] }),
];

// Thief: take from enemies (buffs, stats, gold), and draw their attention.
const thief: SkillDef[] = [
  r({ id: 'pickpocket', name: 'Pickpocket', theme: 'thief', rarity: 'common', cooldown: 4, target: foe('random'), fx: [gold(1)] }),
  r({ id: 'filch', name: 'Filch', theme: 'thief', rarity: 'common', cooldown: 4, target: foe('front'), fx: [steal(), dmg(0.58)] }),
  r({ id: 'distract', name: 'Distract', theme: 'thief', rarity: 'common', cooldown: 6, target: SELF, fx: [taunt(1)] }),
  r({ id: 'plunder', name: 'Plunder', theme: 'thief', rarity: 'rare', cooldown: 5, target: foe('highestHp'), fx: [siphon('attack', 0.6, 5), gold(0.4)] }),
  r({ id: 'cheapShot', name: 'Cheap Shot', theme: 'thief', rarity: 'rare', cooldown: 4, target: foe('front'), fx: [delay(0.5), dmg(0.5)] }),
  r({ id: 'mug', name: 'Mug', theme: 'thief', rarity: 'rare', cooldown: 3, target: foe('front'), fx: [dmg(0.6), gold(0.4)], synergy: { with: 'pickpocket', bonus: 0.3 } }),
  r({ id: 'grandLarceny', name: 'Grand Larceny', theme: 'thief', rarity: 'epic', cooldown: 8, target: foe('front', 'all'), fx: [steal(), siphon('defense', 0.64, 4)] }),
  r({ id: 'masterThief', name: 'Master Thief', theme: 'thief', rarity: 'legendary', cooldown: 10, target: foe('highestHp'), fx: [steal(), siphon('attack', 0.6, 5), gold(0.33)], prerequisite: 'filch' }),
];

const general: SkillDef[] = [
  r({ id: 'smokeBomb', name: 'Smoke Bomb', theme: 'rogue', rarity: 'common', cooldown: 8, target: foe('front', 'column'), fx: [delay(1)] }),
  r({ id: 'twinDaggers', name: 'Twin Daggers', theme: 'rogue', rarity: 'common', cooldown: 2, target: foe('front'), fx: [dmg(1, { hits: 2 })] }),
  r({ id: 'evasion', name: 'Evasion', theme: 'rogue', rarity: 'rare', cooldown: 7, target: SELF, fx: [buff('defense', 1, 5)] }),
];

export const ROGUE_ARCHETYPES: SkillDef[] = [...swashbuckler, ...assassin, ...thief, ...general];
