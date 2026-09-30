import type { SkillDef, Targeting } from '../../combat/types';
import { ally, barrier, buff, cls, debuff, delay, dmg, dot, foe, haste, SELF, skill, slow, summon, type SkillSpec } from '../build';

type Spec = Omit<SkillSpec, 'access' | 'category'> & { category?: SkillSpec['category'] };
const r = (spec: Spec): SkillDef => skill({ category: 'skill', ...spec, access: cls('ranger') });

const MY_PACK: Targeting = { side: 'summons', area: 'all' };

// Beast master: call animals to fight beside the ranger, then lead them.
const beastMaster: SkillDef[] = [
  r({ id: 'callWolf', name: 'Call Wolf', theme: 'beast master', rarity: 'common', cooldown: 10, target: SELF, fx: [summon('wolf')] }),
  r({ id: 'callHawk', name: 'Call Hawk', theme: 'beast master', rarity: 'common', cooldown: 10, target: SELF, fx: [summon('hawk')] }),
  r({ id: 'packHunt', name: 'Pack Hunt', theme: 'beast master', rarity: 'common', cooldown: 6, target: MY_PACK, fx: [buff('attack', 1, 6)] }),
  r({ id: 'feralBond', name: 'Feral Bond', theme: 'beast master', rarity: 'rare', cooldown: 6, target: MY_PACK, fx: [buff('defense', 1, 5)] }),
  r({ id: 'callBear', name: 'Call Bear', theme: 'beast master', rarity: 'rare', cooldown: 12, target: SELF, fx: [summon('bear')] }),
  r({ id: 'coordinatedStrike', name: 'Coordinated Strike', theme: 'beast master', rarity: 'rare', cooldown: 3, condition: { kind: 'hasSummon' }, target: foe('front'), fx: [dmg(1)], synergy: { with: 'callWolf', bonus: 0.3 } }),
  r({ id: 'alphaHowl', name: 'Alpha Howl', theme: 'beast master', rarity: 'epic', cooldown: 8, target: MY_PACK, fx: [buff('attack', 0.5, 5), haste(0.5, 5)] }),
  r({ id: 'wildPack', name: 'Wild Pack', theme: 'beast master', rarity: 'legendary', cooldown: 14, target: SELF, fx: [summon('wolf', 0.5), summon('hawk', 0.5)], prerequisite: 'callWolf' }),
];

// Hunter: pick one target and bring it down.
const hunter: SkillDef[] = [
  r({ id: 'steadyAim', name: 'Steady Aim', theme: 'hunter', rarity: 'common', cooldown: 4, target: foe('highestHp'), fx: [dmg(1)] }),
  r({ id: 'piercingShot', name: 'Piercing Shot', theme: 'hunter', rarity: 'common', cooldown: 3, target: foe('back'), fx: [dmg(1)] }),
  r({ id: 'trap', name: 'Trap', theme: 'hunter', rarity: 'common', cooldown: 6, target: foe('front'), fx: [delay(1)] }),
  r({ id: 'headshot', name: 'Headshot', theme: 'hunter', rarity: 'rare', cooldown: 5, target: foe('lowestHpPct'), fx: [dmg(1)], synergy: { with: 'steadyAim', bonus: 0.3 } }),
  r({ id: 'snare', name: 'Snare', theme: 'hunter', rarity: 'rare', cooldown: 6, target: foe('highestHp'), fx: [slow(1, 4)] }),
  r({ id: 'deadeye', name: 'Deadeye', theme: 'hunter', rarity: 'epic', cooldown: 6, target: foe('highestHp'), fx: [dmg(1, { hits: 2 })] }),
  r({ id: 'killshot', name: 'Killshot', theme: 'hunter', rarity: 'legendary', cooldown: 8, target: foe('lowestHp'), fx: [dmg(1)], prerequisite: 'aimedShot' }),
];

// Pathfinder: read the enemy, open its weak points, then exploit them.
const pathfinder: SkillDef[] = [
  r({ id: 'scout', name: 'Scout', theme: 'pathfinder', rarity: 'common', cooldown: 6, target: foe('highestHp'), fx: [debuff('defense', 1, 5)] }),
  r({ id: 'expose', name: 'Expose', theme: 'pathfinder', rarity: 'common', cooldown: 6, target: foe('front'), fx: [debuff('resistance', 1, 5)] }),
  r({ id: 'trackersEye', name: "Tracker's Eye", theme: 'pathfinder', rarity: 'common', cooldown: 3, target: foe('castSpell'), fx: [dmg(1)] }),
  r({ id: 'findWeakness', name: 'Find Weakness', theme: 'pathfinder', rarity: 'rare', cooldown: 6, target: foe('highestHp'), fx: [debuff('defense', 0.5, 5), debuff('resistance', 0.5, 5)] }),
  r({ id: 'flankingShot', name: 'Flanking Shot', theme: 'pathfinder', rarity: 'rare', cooldown: 5, target: foe('back', 'row'), fx: [dmg(1)] }),
  r({ id: 'terrainAdvantage', name: 'Terrain Advantage', theme: 'pathfinder', rarity: 'epic', cooldown: 8, target: ally('front', 'all'), fx: [buff('attack', 1, 6)], vfx: 'blessing' }),
  r({ id: 'exploit', name: 'Exploit', theme: 'pathfinder', rarity: 'epic', cooldown: 5, target: foe('lowestHpPct'), fx: [dmg(0.6), debuff('defense', 0.4, 4)], synergy: { with: 'scout', bonus: 0.3 } }),
];

const general: SkillDef[] = [
  r({ id: 'fireArrow', name: 'Fire Arrow', theme: 'ranger', rarity: 'common', cooldown: 3, target: foe('random'), fx: [dmg(1, { element: 'fire' })] }),
  r({ id: 'camouflage', name: 'Camouflage', theme: 'ranger', rarity: 'common', cooldown: 6, target: SELF, fx: [barrier(1, 4)] }),
  r({ id: 'barbedArrow', name: 'Barbed Arrow', theme: 'ranger', rarity: 'rare', cooldown: 4, target: foe('front'), fx: [dmg(0.5), dot(0.5, 4)] }),
];

export const RANGER_ARCHETYPES: SkillDef[] = [...beastMaster, ...hunter, ...pathfinder, ...general];
