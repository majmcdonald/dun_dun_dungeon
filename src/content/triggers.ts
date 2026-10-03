import type { SkillDef } from '../combat/types';
import type { Tag } from '../combat/types';
import {
  ally,
  barrier,
  buff,
  chaos,
  cls,
  debuff,
  delay,
  dmg,
  dot,
  foe,
  gold,
  haste,
  heal,
  meter,
  regen,
  SELF,
  self,
  shapeshift,
  SHARED,
  skill,
  slow,
  summon,
  tag,
  taunt,
  toSummons,
  transform,
  type SkillSpec,
} from './build';

// Trigger skills (slot 4): each fires the moment its event happens, then recharges over its cooldown.
// Nobody starts with one; they come from rewards, stores, and events.

// Shared: any class can use these.
export const SHARED_TRIGGERS: SkillDef[] = [
  skill({ id: 'openingStrike', name: 'Opening Strike', category: 'skill', rarity: 'common', access: SHARED, cooldown: 6, trigger: { kind: 'battleStart' }, target: foe('front'), fx: [dmg(1)] }),
  skill({ id: 'payback', name: 'Payback', category: 'skill', rarity: 'common', access: SHARED, cooldown: 3, trigger: { kind: 'whenHit' }, target: foe('attackedMe'), fx: [dmg(1)] }),
  skill({ id: 'guardiansReflex', name: "Guardian's Reflex", category: 'skill', rarity: 'rare', access: SHARED, cooldown: 5, trigger: { kind: 'allyHurt' }, target: ally('lowestHpPct'), fx: [barrier(1, 4)] }),
  skill({ id: 'rallyCry', name: 'Rally Cry', category: 'skill', rarity: 'rare', access: SHARED, cooldown: 10, trigger: { kind: 'allyFalls' }, target: ally('front', 'all'), fx: [buff('attack', 1, 6)] }),
  skill({ id: 'closeRanks', name: 'Close Ranks', category: 'skill', rarity: 'common', access: SHARED, cooldown: 8, trigger: { kind: 'partyLow' }, target: ally('front', 'all'), fx: [barrier(1, 4)] }),
  skill({ id: 'defiance', name: 'Defiance', category: 'skill', rarity: 'rare', access: SHARED, cooldown: 8, trigger: { kind: 'selfLow' }, target: SELF, fx: [barrier(0.6, 5), buff('defense', 0.4, 5)] }),
  skill({ id: 'momentum', name: 'Momentum', category: 'skill', rarity: 'common', access: SHARED, cooldown: 4, trigger: { kind: 'onKill' }, target: SELF, fx: [haste(1, 4)] }),
  skill({ id: 'spoils', name: 'Spoils', category: 'skill', rarity: 'common', access: SHARED, cooldown: 5, trigger: { kind: 'enemyDies' }, target: SELF, fx: [gold(1)] }),
  skill({ id: 'shatterback', name: 'Shatterback', category: 'skill', rarity: 'rare', access: SHARED, cooldown: 5, trigger: { kind: 'barrierBreaks' }, target: foe('front', 'column'), fx: [dmg(1)] }),
  skill({ id: 'invigorate', name: 'Invigorate', category: 'skill', rarity: 'common', access: SHARED, cooldown: 6, trigger: { kind: 'whenHealed' }, target: SELF, fx: [haste(1, 4)] }),
];

type TagSpec = Omit<SkillSpec, 'access'>;
const t = (requires: Tag, spec: TagSpec): SkillDef => skill({ ...spec, access: tag(requires) });
const magic = (element?: 'holy' | 'shadow' | 'fire' | 'ice' | 'lightning') => ({ type: 'magic', ...(element && { element }) }) as const;

// Tag-restricted: usable only by classes with the tag.
export const TAG_TRIGGERS: SkillDef[] = [
  t('martial', { id: 'counterStance', name: 'Counter Stance', category: 'skill', rarity: 'rare', cooldown: 4, trigger: { kind: 'whenHit' }, target: foe('attackedMe'), fx: [dmg(0.7), self(buff('defense', 0.3, 4))] }),
  t('martial', { id: 'bloodiedFury', name: 'Bloodied Fury', category: 'skill', rarity: 'rare', cooldown: 8, trigger: { kind: 'selfLow' }, target: SELF, fx: [buff('attack', 0.5, 6), haste(0.5, 6)] }),
  t('martial', { id: 'finishingBlow', name: 'Finishing Blow', category: 'skill', rarity: 'common', cooldown: 3, trigger: { kind: 'onKill' }, target: foe('lowestHp'), fx: [dmg(1)] }),
  t('caster', { id: 'spellEcho', name: 'Spell Echo', category: 'spell', rarity: 'common', cooldown: 4, trigger: { kind: 'castSpell' }, target: foe('random'), fx: [dmg(1, magic())] }),
  t('caster', { id: 'spellguard', name: 'Spellguard', category: 'spell', rarity: 'rare', cooldown: 6, trigger: { kind: 'whenHit' }, target: SELF, fx: [barrier(1, 4, 'resistance')] }),
  t('caster', { id: 'preparedSpell', name: 'Prepared Spell', category: 'spell', rarity: 'rare', cooldown: 6, trigger: { kind: 'battleStart' }, target: foe('front', 'row'), fx: [dmg(1, magic())] }),
  t('heavy', { id: 'ironSkin', name: 'Iron Skin', category: 'skill', rarity: 'common', cooldown: 5, trigger: { kind: 'barrierBreaks' }, target: SELF, fx: [buff('defense', 1, 5)] }),
  t('heavy', { id: 'bulwarkReflex', name: 'Bulwark Reflex', category: 'skill', rarity: 'rare', cooldown: 6, trigger: { kind: 'allyHurt' }, target: SELF, fx: [taunt(0.5), barrier(0.5, 4)] }),
  t('heavy', { id: 'ironWill', name: 'Iron Will', category: 'skill', rarity: 'epic', cooldown: 10, trigger: { kind: 'selfLow' }, target: SELF, fx: [barrier(0.7, 6), taunt(0.3)] }),
  t('ranged', { id: 'quickDraw', name: 'Quick Draw', category: 'skill', rarity: 'common', cooldown: 5, trigger: { kind: 'battleStart' }, target: foe('back'), fx: [dmg(1)] }),
  t('ranged', { id: 'retreatShot', name: 'Retreat Shot', category: 'skill', rarity: 'rare', cooldown: 4, trigger: { kind: 'whenHit' }, target: foe('attackedMe'), fx: [dmg(0.7), self(haste(0.3, 3))] }),
  t('holy', { id: 'mercy', name: 'Mercy', category: 'spell', rarity: 'common', cooldown: 4, trigger: { kind: 'allyHurt' }, target: ally('lowestHpPct'), fx: [heal(1)], vfx: 'heal' }),
  t('holy', { id: 'martyrsLight', name: "Martyr's Light", category: 'spell', rarity: 'rare', cooldown: 8, trigger: { kind: 'allyFalls' }, target: ally('front', 'all'), fx: [heal(1)], vfx: 'heal' }),
  t('holy', { id: 'heavensAegis', name: "Heaven's Aegis", category: 'spell', rarity: 'epic', cooldown: 10, trigger: { kind: 'partyLow' }, target: ally('front', 'all'), fx: [barrier(1, 5, 'resistance')], vfx: 'blessing' }),
  t('arcane', { id: 'arcaneRush', name: 'Arcane Rush', category: 'spell', rarity: 'rare', cooldown: 6, trigger: { kind: 'castSpell' }, target: SELF, fx: [haste(1, 4)] }),
  t('arcane', { id: 'spellMirror', name: 'Spell Mirror', category: 'spell', rarity: 'epic', cooldown: 6, trigger: { kind: 'whenHit' }, target: foe('attackedMe'), fx: [dmg(1, magic())] }),
  t('nature', { id: 'bloom', name: 'Bloom', category: 'spell', rarity: 'common', cooldown: 6, trigger: { kind: 'whenHealed' }, target: ally('front', 'all'), fx: [regen(1, 4)], vfx: 'heal' }),
  t('nature', { id: 'thornbite', name: 'Thornbite', category: 'skill', rarity: 'rare', cooldown: 4, trigger: { kind: 'whenHit' }, target: foe('attackedMe'), fx: [dot(1, 4, { element: 'poison' })] }),
  t('shadow', { id: 'reapersToll', name: "Reaper's Toll", category: 'spell', rarity: 'rare', cooldown: 5, trigger: { kind: 'enemyDies' }, target: SELF, fx: [buff('magic', 0.5, 6), heal(0.5)] }),
  t('shadow', { id: 'finalCurse', name: 'Final Curse', category: 'spell', rarity: 'epic', cooldown: 10, trigger: { kind: 'onDefeat' }, target: foe('front', 'all'), fx: [dot(1, 5, { stat: 'magic', element: 'shadow' })] }),
];

const c = (classId: string, spec: TagSpec): SkillDef => skill({ ...spec, access: cls(classId) });
const WHEN_HIT = { kind: 'whenHit' } as const;
const SELF_LOW = { kind: 'selfLow' } as const;
const START = { kind: 'battleStart' } as const;
const ON_KILL = { kind: 'onKill' } as const;
const ALLY_FALLS = { kind: 'allyFalls' } as const;

// Class triggers: 3 per class (Knight, Paladin, and Cleric keep their 3 originals; the Bard keeps Swan Song).
export const CLASS_TRIGGERS: SkillDef[] = [
  c('mage', { id: 'rimeBurst', name: 'Rime Burst', category: 'spell', rarity: 'rare', cooldown: 6, trigger: WHEN_HIT, target: foe('attackedMe', 'row'), fx: [dmg(0.6, magic('ice')), slow(0.4, 3)] }),
  c('mage', { id: 'chaosSurge', name: 'Chaos Surge', category: 'spell', rarity: 'rare', cooldown: 5, trigger: { kind: 'castSpell' }, target: foe('random'), fx: [chaos(dmg(1, magic('fire')), dmg(1, magic('lightning')), slow(1, 3))] }),
  c('mage', { id: 'panicPolymorph', name: 'Panic Polymorph', category: 'spell', rarity: 'epic', cooldown: 12, trigger: SELF_LOW, target: foe('highestHp'), fx: [transform(1)] }),
  c('rogue', { id: 'lurkingStrike', name: 'Lurking Strike', category: 'skill', rarity: 'rare', cooldown: 6, trigger: START, target: foe('back'), fx: [dmg(1, { element: 'shadow' })] }),
  c('rogue', { id: 'cutpurse', name: 'Cutpurse', category: 'skill', rarity: 'common', cooldown: 5, trigger: ON_KILL, target: SELF, fx: [gold(0.5), haste(0.5, 3)] }),
  c('rogue', { id: 'smokeAndMirrors', name: 'Smoke and Mirrors', category: 'skill', rarity: 'rare', cooldown: 8, trigger: SELF_LOW, target: SELF, fx: [barrier(0.6, 4), haste(0.4, 4)] }),
  c('ranger', { id: 'quarry', name: 'Quarry', category: 'skill', rarity: 'common', cooldown: 6, trigger: START, target: foe('highestHp'), fx: [debuff('defense', 1, 8)] }),
  c('ranger', { id: 'pinDown', name: 'Pin Down', category: 'skill', rarity: 'rare', cooldown: 5, trigger: WHEN_HIT, target: foe('attackedMe'), fx: [dmg(0.6), slow(0.4, 3)] }),
  c('ranger', { id: 'callOfTheWild', name: 'Call of the Wild', category: 'skill', rarity: 'epic', cooldown: 10, trigger: ALLY_FALLS, target: SELF, fx: [summon('wolf')] }),
  c('barbarian', { id: 'grudge', name: 'Grudge', category: 'skill', rarity: 'common', cooldown: 3, trigger: WHEN_HIT, target: SELF, fx: [meter(1)] }),
  c('barbarian', { id: 'bloodRage', name: 'Blood Rage', category: 'skill', rarity: 'rare', cooldown: 8, trigger: SELF_LOW, target: SELF, fx: [meter(0.5), buff('attack', 0.5, 6)] }),
  c('barbarian', { id: 'stormCall', name: 'Storm Call', category: 'skill', rarity: 'epic', cooldown: 8, trigger: ON_KILL, target: foe('front', 'all'), fx: [dmg(1, { element: 'lightning' })] }),
  c('necromancer', { id: 'deathGrip', name: 'Death Grip', category: 'spell', rarity: 'common', cooldown: 5, trigger: { kind: 'allyHurt' }, target: foe('mostDamage'), fx: [delay(1)] }),
  c('necromancer', { id: 'raiseTheFallen', name: 'Raise the Fallen', category: 'spell', rarity: 'rare', cooldown: 10, trigger: { kind: 'enemyDies' }, target: SELF, fx: [summon('skeleton')] }),
  c('necromancer', { id: 'lichWard', name: 'Lich Ward', category: 'spell', rarity: 'epic', cooldown: 10, trigger: SELF_LOW, target: foe('highestHp'), fx: [self(barrier(0.5, 5, 'resistance')), dmg(0.5, magic('shadow'))] }),
  c('druid', { id: 'barkguard', name: 'Barkguard', category: 'spell', rarity: 'common', cooldown: 5, trigger: WHEN_HIT, target: SELF, fx: [barrier(1, 4)] }),
  c('druid', { id: 'wildReflex', name: 'Wild Reflex', category: 'spell', rarity: 'rare', cooldown: 12, trigger: SELF_LOW, target: SELF, fx: [shapeshift(1, 6)] }),
  c('druid', { id: 'naturesAlly', name: "Nature's Ally", category: 'spell', rarity: 'epic', cooldown: 12, trigger: ALLY_FALLS, target: SELF, fx: [summon('bear')] }),
  c('monk', { id: 'flowingCounter', name: 'Flowing Counter', category: 'skill', rarity: 'common', cooldown: 3, trigger: WHEN_HIT, target: foe('attackedMe'), fx: [dmg(0.6), self(meter(0.4))] }),
  c('monk', { id: 'innerCalm', name: 'Inner Calm', category: 'spell', rarity: 'rare', cooldown: 8, trigger: SELF_LOW, target: SELF, fx: [heal(0.6), regen(0.4, 4)], vfx: 'heal' }),
  c('monk', { id: 'spiritBurst', name: 'Spirit Burst', category: 'skill', rarity: 'epic', cooldown: 8, trigger: START, target: SELF, fx: [meter(1)] }),
  c('warlock', { id: 'soulFeed', name: 'Soul Feed', category: 'spell', rarity: 'common', cooldown: 4, trigger: ON_KILL, target: SELF, fx: [toSummons(buff('attack', 1, 6))] }),
  c('warlock', { id: 'bloodDebt', name: 'Blood Debt', category: 'spell', rarity: 'rare', cooldown: 6, trigger: SELF_LOW, target: foe('highestHp'), fx: [dmg(1, { ...magic('shadow'), drain: 0.5 })] }),
  c('warlock', { id: 'infernalWrath', name: 'Infernal Wrath', category: 'spell', rarity: 'epic', cooldown: 10, trigger: ALLY_FALLS, target: foe('front', 'all'), fx: [dmg(1, magic('fire'))] }),
  c('bard', { id: 'encore', name: 'Encore', category: 'spell', rarity: 'rare', cooldown: 8, trigger: { kind: 'castSpell' }, target: ally('front', 'all'), fx: [haste(1, 3)] }),
  c('bard', { id: 'battleHymn', name: 'Battle Hymn', category: 'spell', rarity: 'epic', cooldown: 10, trigger: START, target: ally('front', 'all'), fx: [buff('attack', 0.5, 8), buff('magic', 0.5, 8)], vfx: 'blessing' }),
];
