import type { SkillDef, Targeting } from '../../combat/types';
import { ally, barrier, buff, cls, debuff, dmg, dot, foe, haste, heal, regen, self, SELF, shapeshift, skill, slow, summon, type SkillSpec } from '../build';

type Spec = Omit<SkillSpec, 'access' | 'category'> & { category?: SkillSpec['category'] };
const d = (spec: Spec): SkillDef => skill({ category: 'spell', ...spec, access: cls('druid') });

const MY_ANIMALS: Targeting = { side: 'summons', area: 'all' };
const SHIFTED = { kind: 'shapeshifted' } as const;
const poison = { type: 'magic', element: 'poison' } as const;

// Shapeshift: take a beast form. While shifted, only form attacks run, and they hit much harder.
const shapeshiftSkills: SkillDef[] = [
  d({ id: 'bearForm', name: 'Bear Form', theme: 'shapeshift', rarity: 'common', cooldown: 12, target: SELF, fx: [shapeshift(1, 6)] }),
  d({ id: 'catForm', name: 'Cat Form', theme: 'shapeshift', rarity: 'rare', cooldown: 12, target: SELF, fx: [shapeshift(0.6, 5), haste(0.4, 5)] }),
  d({ id: 'maul', name: 'Maul', theme: 'shapeshift', rarity: 'common', category: 'skill', cooldown: 2, form: true, condition: SHIFTED, target: foe('front'), fx: [dmg(1)] }),
  d({ id: 'rake', name: 'Rake', theme: 'shapeshift', rarity: 'common', category: 'skill', cooldown: 2.5, form: true, condition: SHIFTED, target: foe('front'), fx: [dmg(0.6), dot(0.4, 3)] }),
  d({ id: 'swipe', name: 'Swipe', theme: 'shapeshift', rarity: 'rare', category: 'skill', cooldown: 3, form: true, condition: SHIFTED, target: foe('front', 'column'), fx: [dmg(1)], synergy: { with: 'bearForm', bonus: 0.3 } }),
  d({ id: 'ferociousBite', name: 'Ferocious Bite', theme: 'shapeshift', rarity: 'epic', category: 'skill', cooldown: 4, form: true, condition: SHIFTED, target: foe('lowestHp'), fx: [dmg(1)] }),
  d({ id: 'primalFury', name: 'Primal Fury', theme: 'shapeshift', rarity: 'legendary', category: 'skill', cooldown: 5, form: true, condition: SHIFTED, target: foe('front', 'all'), fx: [dmg(1, { hits: 2 })], prerequisite: 'bearForm' }),
];

// Summon: call animals to fight alongside the druid.
const summonSkills: SkillDef[] = [
  d({ id: 'summonBoar', name: 'Summon Boar', theme: 'summon', rarity: 'common', cooldown: 10, target: SELF, fx: [summon('boar')] }),
  d({ id: 'summonOwl', name: 'Summon Owl', theme: 'summon', rarity: 'common', cooldown: 10, target: SELF, fx: [summon('owl')] }),
  d({ id: 'wildBlessing', name: 'Wild Blessing', theme: 'summon', rarity: 'common', cooldown: 6, target: MY_ANIMALS, fx: [buff('attack', 1, 6)] }),
  d({ id: 'mendBeast', name: 'Mend Beast', theme: 'summon', rarity: 'common', cooldown: 5, target: MY_ANIMALS, fx: [heal(1)], vfx: 'heal' }),
  d({ id: 'summonBear', name: 'Summon Bear', theme: 'summon', rarity: 'rare', cooldown: 12, target: SELF, fx: [summon('bear')] }),
  d({ id: 'naturesCall', name: "Nature's Call", theme: 'summon', rarity: 'rare', cooldown: 14, target: SELF, fx: [summon('boar', 0.5), summon('owl', 0.5)], synergy: { with: 'wildBlessing', bonus: 0.3 } }),
  d({ id: 'stampede', name: 'Stampede', theme: 'summon', rarity: 'epic', cooldown: 7, condition: { kind: 'hasSummon' }, target: foe('front', 'all'), fx: [dmg(1)] }),
];

// Fauna: plants that slow the whole battle, the druid included.
const fauna: SkillDef[] = [
  d({ id: 'entanglingRoots', name: 'Entangling Roots', theme: 'fauna', rarity: 'common', cooldown: 6, target: foe('front', 'column'), fx: [slow(0.7, 4), dot(0.3, 4, { stat: 'magic', element: 'poison' })] }),
  d({ id: 'overgrowth', name: 'Overgrowth', theme: 'fauna', rarity: 'common', cooldown: 8, target: foe('front', 'all'), fx: [slow(1.3, 4), self(slow(0.3, 4))] }),
  d({ id: 'thornwall', name: 'Thornwall', theme: 'fauna', rarity: 'common', cooldown: 8, target: ally('front', 'all'), fx: [barrier(1, 4, 'resistance')] }),
  d({ id: 'sporeCloud', name: 'Spore Cloud', theme: 'fauna', rarity: 'rare', cooldown: 6, target: foe('front', 'row'), fx: [slow(0.5, 4), debuff('attack', 0.5, 4)], synergy: { with: 'entanglingRoots', bonus: 0.3 } }),
  d({ id: 'verdantGrove', name: 'Verdant Grove', theme: 'fauna', rarity: 'rare', cooldown: 8, target: ally('front', 'all'), fx: [regen(1.2, 5), self(slow(0.2, 5))], vfx: 'heal' }),
  d({ id: 'stranglingVines', name: 'Strangling Vines', theme: 'fauna', rarity: 'epic', cooldown: 9, target: foe('front', 'all'), fx: [slow(0.6, 5), dot(0.4, 5, { stat: 'magic', element: 'poison' })] }),
  d({ id: 'worldTree', name: 'World Tree', theme: 'fauna', rarity: 'legendary', cooldown: 12, target: ally('front', 'all'), fx: [regen(0.6, 6), barrier(0.4, 6, 'resistance')], prerequisite: 'barkskin', vfx: 'heal' }),
];

const general: SkillDef[] = [
  d({ id: 'moonfire', name: 'Moonfire', theme: 'druid', rarity: 'common', cooldown: 2.5, target: foe('random'), fx: [dmg(1, { type: 'magic' })] }),
  d({ id: 'thornVolley', name: 'Thorn Volley', theme: 'druid', rarity: 'rare', cooldown: 3, target: foe('random'), fx: [dmg(1, { ...poison, hits: 3 })] }),
  d({ id: 'hurricane', name: 'Hurricane', theme: 'druid', rarity: 'rare', cooldown: 5, target: foe('front', 'column'), fx: [dmg(0.6, { type: 'magic', element: 'lightning' }), slow(0.4, 3)] }),
  d({ id: 'starfall', name: 'Starfall', theme: 'druid', rarity: 'epic', cooldown: 8, target: foe('front', 'all'), fx: [dmg(1, { type: 'magic' })] }),
];

export const DRUID_ARCHETYPES: SkillDef[] = [...shapeshiftSkills, ...summonSkills, ...fauna, ...general];
