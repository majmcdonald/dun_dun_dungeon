import type { SkillDef } from '../combat/types';
import { BARBARIAN_ARCHETYPES } from './archetypes/barbarian';
import { BARD_ARCHETYPES } from './archetypes/bard';
import { CLERIC_ARCHETYPES } from './archetypes/cleric';
import { DRUID_ARCHETYPES } from './archetypes/druid';
import { KNIGHT_ARCHETYPES } from './archetypes/knight';
import { MAGE_ARCHETYPES } from './archetypes/mage';
import { MONK_ARCHETYPES } from './archetypes/monk';
import { NECROMANCER_ARCHETYPES } from './archetypes/necromancer';
import { PALADIN_ARCHETYPES } from './archetypes/paladin';
import { RANGER_ARCHETYPES } from './archetypes/ranger';
import { ROGUE_ARCHETYPES } from './archetypes/rogue';
import { WARLOCK_ARCHETYPES } from './archetypes/warlock';
import {
  ally,
  barrier,
  buff,
  cleanse,
  cls,
  debuff,
  delay,
  dmg,
  dot,
  foe,
  haste,
  heal,
  meter,
  regen,
  SELF,
  self,
  SHARED,
  skill,
  slow,
  tag,
  taunt,
} from './build';
import { CLASS_TRIGGERS, SHARED_TRIGGERS, TAG_TRIGGERS } from './triggers';

const magic = (element?: 'fire' | 'ice' | 'lightning' | 'holy' | 'shadow' | 'poison') =>
  ({ type: 'magic', ...(element && { element }) }) as const;

const shared: SkillDef[] = [
  skill({ id: 'strike', name: 'Strike', category: 'skill', rarity: 'common', access: SHARED, cooldown: 2, target: foe('front'), fx: [dmg(1)] }),
  skill({ id: 'jab', name: 'Jab', category: 'skill', rarity: 'common', access: SHARED, cooldown: 1.5, target: foe('front'), fx: [dmg(1)] }),
  skill({ id: 'throwStone', name: 'Throw Stone', category: 'skill', rarity: 'common', access: SHARED, cooldown: 2.5, target: foe('random'), fx: [dmg(1)] }),
  skill({ id: 'guard', name: 'Guard', category: 'skill', rarity: 'common', access: SHARED, cooldown: 5, target: SELF, fx: [barrier(1, 4)] }),
  skill({ id: 'focus', name: 'Focus', category: 'skill', rarity: 'common', access: SHARED, cooldown: 6, target: SELF, fx: [buff('attack', 0.5, 5), buff('magic', 0.5, 5)] }),
  skill({ id: 'poisonDart', name: 'Poison Dart', category: 'skill', rarity: 'common', access: SHARED, cooldown: 3, target: foe('back'), fx: [dot(1, 4, { element: 'poison' })] }),
  skill({ id: 'spark', name: 'Spark', category: 'spell', rarity: 'common', access: SHARED, cooldown: 2, target: foe('random'), fx: [dmg(1, magic('lightning'))] }),
  skill({ id: 'frostTouch', name: 'Frost Touch', category: 'spell', rarity: 'common', access: SHARED, cooldown: 3, target: foe('front'), fx: [dmg(0.7, magic('ice')), debuff('attack', 0.3, 4)] }),
  skill({ id: 'ember', name: 'Ember', category: 'spell', rarity: 'common', access: SHARED, cooldown: 3, target: foe('lowestHp'), fx: [dot(1, 3, { stat: 'magic', element: 'fire' })] }),
  skill({ id: 'antidote', name: 'Antidote', category: 'skill', rarity: 'common', access: SHARED, cooldown: 6, target: ally('lowestHpPct'), fx: [heal(0.9), cleanse()], vfx: 'heal' }),
  skill({ id: 'mendWounds', name: 'Mend Wounds', category: 'spell', rarity: 'common', access: SHARED, cooldown: 4, target: ally('lowestHpPct'), fx: [regen(1, 4)] }),
  skill({ id: 'heavyBlow', name: 'Heavy Blow', category: 'skill', rarity: 'rare', access: SHARED, cooldown: 4, target: foe('front'), fx: [dmg(1)], synergy: { with: 'focus', bonus: 0.25 } }),
  skill({ id: 'secondWind', name: 'Second Wind', category: 'skill', rarity: 'rare', access: SHARED, cooldown: 8, target: SELF, fx: [buff('defense', 0.5, 5), buff('resistance', 0.5, 5)] }),
  skill({ id: 'rally', name: 'Rally', category: 'skill', rarity: 'rare', access: SHARED, cooldown: 8, target: ally('front', 'all'), fx: [buff('attack', 1, 6)] }),
  skill({ id: 'weaken', name: 'Weaken', category: 'spell', rarity: 'rare', access: SHARED, cooldown: 5, target: foe('highestHp'), fx: [debuff('attack', 1, 5)] }),
  skill({ id: 'tempest', name: 'Tempest', category: 'skill', rarity: 'epic', access: SHARED, cooldown: 6, target: foe('front', 'all'), fx: [dmg(1)] }),
];

const tagged: SkillDef[] = [
  // martial
  skill({ id: 'crushingBlow', name: 'Crushing Blow', category: 'skill', rarity: 'common', access: tag('martial'), cooldown: 3, target: foe('front'), fx: [dmg(0.8), debuff('defense', 0.2, 4)] }),
  skill({ id: 'sweep', name: 'Sweep', category: 'skill', rarity: 'rare', access: tag('martial'), cooldown: 4, target: foe('front', 'column'), fx: [dmg(1)], synergy: { with: 'crushingBlow', bonus: 0.3 } }),
  skill({ id: 'battleCry', name: 'Battle Cry', category: 'skill', rarity: 'epic', access: tag('martial'), cooldown: 8, target: ally('front', 'all'), fx: [buff('attack', 0.6, 6), haste(0.4, 6)], vfx: 'blessing' }),
  // caster
  skill({ id: 'magicMissile', name: 'Magic Missile', category: 'spell', rarity: 'common', access: tag('caster'), cooldown: 2, target: foe('random'), fx: [dmg(1, { ...magic(), hits: 3 })] }),
  skill({ id: 'arcaneShield', name: 'Arcane Shield', category: 'spell', rarity: 'rare', access: tag('caster'), cooldown: 6, target: SELF, fx: [barrier(0.7, 4, 'resistance'), haste(0.3, 4)] }),
  skill({ id: 'manaSurge', name: 'Mana Surge', category: 'spell', rarity: 'epic', access: tag('caster'), cooldown: 8, target: SELF, fx: [buff('magic', 1, 6)] }),
  // heavy
  skill({ id: 'brace', name: 'Brace', category: 'skill', rarity: 'common', access: tag('heavy'), cooldown: 5, target: SELF, fx: [barrier(0.7, 4), buff('defense', 0.3, 4)] }),
  skill({ id: 'shieldWall', name: 'Shield Wall', category: 'skill', rarity: 'rare', access: tag('heavy'), cooldown: 8, target: ally('front', 'all'), fx: [barrier(1, 4)], synergy: { with: 'brace', bonus: 0.3 } }),
  skill({ id: 'unbreakable', name: 'Unbreakable', category: 'skill', rarity: 'epic', access: tag('heavy'), cooldown: 10, target: SELF, fx: [buff('defense', 0.45, 6), buff('resistance', 0.3, 6), taunt(0.25)] }),
  // ranged
  skill({ id: 'quickShot', name: 'Quick Shot', category: 'skill', rarity: 'common', access: tag('ranged'), cooldown: 1.5, target: foe('random'), fx: [dmg(0.75), self(haste(0.25, 2))] }),
  skill({ id: 'pinningShot', name: 'Pinning Shot', category: 'skill', rarity: 'rare', access: tag('ranged'), cooldown: 4, target: foe('back'), fx: [dmg(0.7), debuff('attack', 0.3, 4)] }),
  skill({ id: 'rainOfArrows', name: 'Rain of Arrows', category: 'skill', rarity: 'epic', access: tag('ranged'), cooldown: 6, target: foe('front', 'all'), fx: [dmg(1, { hits: 2 })], synergy: { with: 'pinningShot', bonus: 0.3 } }),
  // holy
  skill({ id: 'smite', name: 'Smite', category: 'spell', rarity: 'common', access: tag('holy'), cooldown: 3.5, target: foe('castDefensive'), fx: [dmg(1, magic('holy'))] }),
  skill({ id: 'lightBurst', name: 'Light Burst', category: 'spell', rarity: 'rare', access: tag('holy'), cooldown: 6, target: ally('front', 'all'), fx: [heal(0.71), cleanse()], vfx: 'heal' }),
  skill({ id: 'consecrate', name: 'Consecrate', category: 'spell', rarity: 'epic', access: tag('holy'), cooldown: 6, target: foe('front', 'row'), fx: [dot(1, 4, { stat: 'magic', element: 'holy' })], synergy: { with: 'smite', bonus: 0.25 } }),
  // arcane
  skill({ id: 'arcaneBolt', name: 'Arcane Bolt', category: 'spell', rarity: 'common', access: tag('arcane'), cooldown: 2.5, target: foe('mostDamage'), fx: [dmg(1, magic())] }),
  skill({ id: 'manaBurn', name: 'Mana Burn', category: 'spell', rarity: 'rare', access: tag('arcane'), cooldown: 4, target: foe('castSpell'), fx: [dmg(0.7, magic()), debuff('magic', 0.3, 4)], synergy: { with: 'arcaneBolt', bonus: 0.3 } }),
  skill({ id: 'arcaneBarrage', name: 'Arcane Barrage', category: 'spell', rarity: 'epic', access: tag('arcane'), cooldown: 5, target: foe('random'), fx: [dmg(1, { ...magic(), hits: 4 })] }),
  // nature
  skill({ id: 'thornLash', name: 'Thorn Lash', category: 'spell', rarity: 'common', access: tag('nature'), cooldown: 3, target: foe('front'), fx: [dmg(0.6, magic('poison')), dot(0.4, 3, { stat: 'magic', element: 'poison' })] }),
  skill({ id: 'entangle', name: 'Entangle', category: 'spell', rarity: 'rare', access: tag('nature'), cooldown: 5, target: foe('front', 'column'), fx: [debuff('attack', 1, 4)], synergy: { with: 'thornLash', bonus: 0.25 } }),
  skill({ id: 'wildGrowth', name: 'Wild Growth', category: 'spell', rarity: 'epic', access: tag('nature'), cooldown: 8, target: ally('front', 'all'), fx: [regen(1, 5)], vfx: 'heal' }),
  // shadow
  skill({ id: 'shadowBolt', name: 'Shadow Bolt', category: 'spell', rarity: 'common', access: tag('shadow'), cooldown: 2.5, target: foe('lowestHp'), fx: [dmg(1, magic('shadow'))] }),
  skill({ id: 'curseOfWeakness', name: 'Curse of Weakness', category: 'spell', rarity: 'rare', access: tag('shadow'), cooldown: 5, target: foe('highestHp'), fx: [debuff('attack', 0.5, 5), debuff('magic', 0.5, 5)] }),
  skill({ id: 'lifeTap', name: 'Life Tap', category: 'spell', rarity: 'epic', access: tag('shadow'), cooldown: 4, target: foe('front'), fx: [dmg(1, { ...magic('shadow'), drain: 0.5 })], synergy: { with: 'curseOfWeakness', bonus: 0.3 } }),
];

const knight: SkillDef[] = [
  skill({ id: 'slash', name: 'Slash', category: 'skill', rarity: 'common', access: cls('knight'), cooldown: 2, target: foe('front'), fx: [dmg(1)], synergy: { with: 'shieldBash', bonus: 0.25 } }),
  skill({ id: 'ironGuard', name: 'Iron Guard', category: 'skill', rarity: 'common', access: cls('knight'), cooldown: 6, target: SELF, fx: [barrier(0.7, 4), taunt(0.3)] }),
  skill({ id: 'shieldBash', name: 'Shield Bash', category: 'skill', rarity: 'rare', access: cls('knight'), cooldown: 4, target: foe('attackedMe'), fx: [dmg(0.7), delay(0.3)], synergy: { with: 'ironGuard', bonus: 0.3 } }),
  skill({ id: 'holdTheLine', name: 'Hold the Line', category: 'skill', rarity: 'epic', access: cls('knight'), cooldown: 8, target: ally('front', 'all'), fx: [buff('defense', 1, 6)], vfx: 'blessing' }),
  skill({ id: 'lastStand', name: 'Last Stand', category: 'skill', rarity: 'legendary', access: cls('knight'), cooldown: 10, target: SELF, fx: [barrier(0.6, 5), buff('defense', 0.4, 5)], prerequisite: 'ironGuard', vfx: 'blessing' }),
];

const mage: SkillDef[] = [
  skill({ id: 'fireball', name: 'Fireball', category: 'spell', rarity: 'common', access: cls('mage'), cooldown: 5, target: foe('lowestHp', 'row'), fx: [dmg(1, magic('fire'))], vfx: 'fireball' }),
  skill({ id: 'frostBolt', name: 'Frost Bolt', category: 'spell', rarity: 'common', access: cls('mage'), cooldown: 2.5, target: foe('front'), fx: [dmg(0.8, magic('ice')), slow(0.2, 3)], synergy: { with: 'blizzard', bonus: 0.3 } }),
  skill({ id: 'chainLightning', name: 'Chain Lightning', category: 'spell', rarity: 'rare', access: cls('mage'), cooldown: 4, target: foe('random', 'column'), fx: [dmg(1, magic('lightning'))], synergy: { with: 'spark', bonus: 0.25 } }),
  skill({ id: 'blizzard', name: 'Blizzard', category: 'spell', rarity: 'epic', access: cls('mage'), cooldown: 7, target: foe('front', 'all'), fx: [dmg(0.7, magic('ice')), debuff('attack', 0.3, 4)] }),
  skill({ id: 'meteor', name: 'Meteor', category: 'spell', rarity: 'legendary', access: cls('mage'), cooldown: 9, target: foe('highestHp', 'all'), fx: [dmg(0.8, magic('fire')), dot(0.2, 3, { stat: 'magic', element: 'fire' })], prerequisite: 'fireball', vfx: 'fireball' }),
];

const cleric: SkillDef[] = [
  skill({ id: 'heal', name: 'Heal', category: 'spell', rarity: 'common', access: cls('cleric'), cooldown: 3, target: ally('lowestHpPct'), fx: [heal(1)], vfx: 'heal', synergy: { with: 'blessing', bonus: 0.25 } }),
  skill({ id: 'blessing', name: 'Blessing', category: 'spell', rarity: 'common', access: cls('cleric'), cooldown: 8, target: ally('front', 'all'), fx: [buff('defense', 1, 6)], vfx: 'blessing' }),
  skill({ id: 'sanctuary', name: 'Sanctuary', category: 'spell', rarity: 'rare', access: cls('cleric'), cooldown: 8, target: ally('front', 'all'), fx: [barrier(1, 4, 'resistance')], vfx: 'blessing' }),
  skill({ id: 'divineLight', name: 'Divine Light', category: 'spell', rarity: 'epic', access: cls('cleric'), cooldown: 7, target: ally('front', 'all'), fx: [heal(0.75), cleanse()], vfx: 'heal', synergy: { with: 'sanctuary', bonus: 0.3 } }),
  skill({ id: 'miracle', name: 'Miracle', category: 'spell', rarity: 'legendary', access: cls('cleric'), cooldown: 10, target: ally('front', 'all'), fx: [heal(0.6), regen(0.4, 4)], prerequisite: 'heal', vfx: 'heal' }),
];

const rogue: SkillDef[] = [
  skill({ id: 'backstab', name: 'Backstab', category: 'skill', rarity: 'common', access: cls('rogue'), cooldown: 3, target: foe('back'), fx: [dmg(1, { element: 'shadow' })] }),
  skill({ id: 'poisonedBlade', name: 'Poisoned Blade', category: 'skill', rarity: 'common', access: cls('rogue'), cooldown: 2.5, target: foe('front'), fx: [dmg(0.6), dot(0.4, 4, { element: 'poison' })], synergy: { with: 'poisonDart', bonus: 0.3 } }),
  skill({ id: 'shadowStrike', name: 'Shadow Strike', category: 'skill', rarity: 'rare', access: cls('rogue'), cooldown: 4, target: foe('lowestHpPct'), fx: [dmg(1, { element: 'shadow' })] }),
  skill({ id: 'fanOfKnives', name: 'Fan of Knives', category: 'skill', rarity: 'epic', access: cls('rogue'), cooldown: 6, target: foe('front', 'all'), fx: [dmg(1, { hits: 2 })] }),
  skill({ id: 'assassinate', name: 'Assassinate', category: 'skill', rarity: 'legendary', access: cls('rogue'), cooldown: 8, target: foe('lowestHp'), fx: [dmg(1, { element: 'shadow' })], prerequisite: 'backstab', synergy: { with: 'shadowStrike', bonus: 0.3 } }),
];

const ranger: SkillDef[] = [
  skill({ id: 'aimedShot', name: 'Aimed Shot', category: 'skill', rarity: 'common', access: cls('ranger'), cooldown: 3, target: foe('back'), fx: [dmg(1)], synergy: { with: 'quickShot', bonus: 0.25 } }),
  skill({ id: 'volley', name: 'Volley', category: 'skill', rarity: 'common', access: cls('ranger'), cooldown: 3, target: foe('random'), fx: [dmg(1, { hits: 3 })] }),
  skill({ id: 'poisonArrow', name: 'Poison Arrow', category: 'skill', rarity: 'rare', access: cls('ranger'), cooldown: 4, target: foe('highestHp'), fx: [dmg(0.5), dot(0.5, 4, { element: 'poison' })], synergy: { with: 'huntersMark', bonus: 0.3 } }),
  skill({ id: 'huntersMark', name: "Hunter's Mark", category: 'skill', rarity: 'epic', access: cls('ranger'), cooldown: 6, target: foe('highestHp'), fx: [dmg(0.5), debuff('defense', 0.5, 6)] }),
  skill({ id: 'stormOfArrows', name: 'Storm of Arrows', category: 'skill', rarity: 'legendary', access: cls('ranger'), cooldown: 8, target: foe('front', 'all'), fx: [dmg(1, { hits: 3 })], prerequisite: 'volley' }),
];

const barbarian: SkillDef[] = [
  skill({ id: 'cleave', name: 'Cleave', category: 'skill', rarity: 'common', access: cls('barbarian'), cooldown: 4, target: foe('front', 'column'), fx: [dmg(1)] }),
  skill({ id: 'rage', name: 'Rage', category: 'skill', rarity: 'common', access: cls('barbarian'), cooldown: 8, target: SELF, fx: [buff('attack', 1, 6)] }),
  skill({ id: 'bloodthirst', name: 'Bloodthirst', category: 'skill', rarity: 'rare', access: cls('barbarian'), cooldown: 3, target: foe('front'), fx: [dmg(1, { drain: 0.4 })], synergy: { with: 'rage', bonus: 0.3 } }),
  skill({ id: 'whirlwind', name: 'Whirlwind', category: 'skill', rarity: 'epic', access: cls('barbarian'), cooldown: 6, target: foe('front', 'all'), fx: [dmg(1)], synergy: { with: 'cleave', bonus: 0.25 } }),
  skill({ id: 'berserk', name: 'Berserk', category: 'skill', rarity: 'legendary', access: cls('barbarian'), cooldown: 6, target: foe('front'), fx: [dmg(1, { hits: 3, drain: 0.3 })], prerequisite: 'rage' }),
];

const paladin: SkillDef[] = [
  skill({ id: 'holyStrike', name: 'Holy Strike', category: 'skill', rarity: 'common', access: cls('paladin'), cooldown: 2.5, target: foe('front'), fx: [dmg(1, { element: 'holy' })], synergy: { with: 'smite', bonus: 0.25 } }),
  skill({ id: 'layOnHands', name: 'Purifying Light', category: 'spell', rarity: 'common', access: cls('paladin'), cooldown: 6, target: ally('front', 'all'), fx: [heal(0.71), cleanse()], vfx: 'heal' }),
  skill({ id: 'aegis', name: 'Aegis', category: 'spell', rarity: 'rare', access: cls('paladin'), cooldown: 6, target: ally('lowestHpPct'), fx: [barrier(1, 4)] }),
  skill({ id: 'divineShield', name: 'Divine Shield', category: 'spell', rarity: 'epic', access: cls('paladin'), cooldown: 9, target: ally('front', 'all'), fx: [barrier(1, 4)], vfx: 'blessing' }),
  skill({ id: 'avengingWrath', name: 'Avenging Wrath', category: 'skill', rarity: 'legendary', access: cls('paladin'), cooldown: 8, target: foe('front', 'column'), fx: [dmg(1, { element: 'holy' })], prerequisite: 'holyStrike', synergy: { with: 'aegis', bonus: 0.25 } }),
];

const necromancer: SkillDef[] = [
  skill({ id: 'siphonLife', name: 'Siphon Life', category: 'spell', rarity: 'common', access: cls('necromancer'), cooldown: 3, target: foe('lowestHpPct'), fx: [dmg(1, { ...magic('shadow'), drain: 0.5 })] }),
  skill({ id: 'curseOfFrailty', name: 'Curse of Frailty', category: 'spell', rarity: 'common', access: cls('necromancer'), cooldown: 6, target: foe('highestHp'), fx: [debuff('defense', 0.5, 5), debuff('resistance', 0.5, 5)] }),
  skill({ id: 'boneSpear', name: 'Bone Spear', category: 'spell', rarity: 'rare', access: cls('necromancer'), cooldown: 4, target: foe('front', 'column'), fx: [dmg(1, magic())], synergy: { with: 'siphonLife', bonus: 0.25 } }),
  skill({ id: 'plague', name: 'Plague', category: 'spell', rarity: 'epic', access: cls('necromancer'), cooldown: 8, target: foe('front', 'all'), fx: [dot(1, 5, { stat: 'magic', element: 'poison' })], synergy: { with: 'curseOfFrailty', bonus: 0.3 } }),
  skill({ id: 'soulHarvest', name: 'Soul Harvest', category: 'spell', rarity: 'legendary', access: cls('necromancer'), cooldown: 8, target: foe('front', 'all'), fx: [dmg(1, { ...magic('shadow'), drain: 0.4 })], prerequisite: 'siphonLife' }),
];

const druid: SkillDef[] = [
  skill({ id: 'rejuvenate', name: 'Rejuvenate', category: 'spell', rarity: 'common', access: cls('druid'), cooldown: 4, target: ally('front', 'all'), fx: [regen(1, 4)], vfx: 'heal', synergy: { with: 'barkskin', bonus: 0.25 } }),
  skill({ id: 'barkskin', name: 'Barkskin', category: 'spell', rarity: 'common', access: cls('druid'), cooldown: 6, target: ally('lowestHpPct'), fx: [barrier(1, 4, 'resistance')] }),
  skill({ id: 'brambles', name: 'Brambles', category: 'spell', rarity: 'rare', access: cls('druid'), cooldown: 5, target: foe('front', 'column'), fx: [dot(1, 4, { stat: 'magic', element: 'poison' })], synergy: { with: 'thornLash', bonus: 0.3 } }),
  skill({ id: 'naturesGrace', name: "Nature's Grace", category: 'spell', rarity: 'epic', access: cls('druid'), cooldown: 8, target: ally('front', 'all'), fx: [regen(0.7, 5), buff('resistance', 0.3, 5)], vfx: 'heal' }),
  skill({ id: 'tranquility', name: 'Tranquility', category: 'spell', rarity: 'legendary', access: cls('druid'), cooldown: 10, target: ally('front', 'all'), fx: [heal(0.42), regen(0.43, 5), cleanse()], prerequisite: 'rejuvenate', vfx: 'heal' }),
];

const monk: SkillDef[] = [
  skill({ id: 'flurry', name: 'Flurry', category: 'skill', rarity: 'common', access: cls('monk'), cooldown: 2.5, target: foe('front'), fx: [dmg(1, { hits: 3 })] }),
  skill({ id: 'innerPeace', name: 'Inner Peace', category: 'skill', rarity: 'common', access: cls('monk'), cooldown: 8, target: SELF, fx: [buff('defense', 0.35, 6), buff('resistance', 0.35, 6), meter(0.3)] }),
  skill({ id: 'palmStrike', name: 'Palm Strike', category: 'skill', rarity: 'rare', access: cls('monk'), cooldown: 3, target: foe('attackedMe'), fx: [dmg(0.7, { element: 'holy' }), debuff('attack', 0.3, 4)], synergy: { with: 'flurry', bonus: 0.25 } }),
  skill({ id: 'hundredFists', name: 'Hundred Fists', category: 'skill', rarity: 'epic', access: cls('monk'), cooldown: 5, target: foe('front'), fx: [dmg(1, { hits: 6 })], synergy: { with: 'innerPeace', bonus: 0.3 } }),
  skill({ id: 'ascension', name: 'Ascension', category: 'skill', rarity: 'legendary', access: cls('monk'), cooldown: 6, target: foe('lowestHpPct'), fx: [dmg(1, { element: 'holy', hits: 4, drain: 0.4 })], prerequisite: 'flurry' }),
];

const bard: SkillDef[] = [
  skill({ id: 'inspire', name: 'Inspire', category: 'spell', rarity: 'common', access: cls('bard'), cooldown: 8, target: ally('front', 'all'), fx: [buff('attack', 0.35, 6), haste(0.35, 6), regen(0.3, 4)], vfx: 'blessing' }),
  skill({ id: 'discord', name: 'Discord', category: 'spell', rarity: 'common', access: cls('bard'), cooldown: 4, target: foe('random'), fx: [dmg(0.5, magic()), debuff('attack', 0.5, 4)] }),
  skill({ id: 'balladOfResolve', name: 'Ballad of Resolve', category: 'spell', rarity: 'rare', access: cls('bard'), cooldown: 8, target: ally('front', 'all'), fx: [buff('defense', 0.5, 6), buff('resistance', 0.5, 6)], vfx: 'blessing', synergy: { with: 'inspire', bonus: 0.25 } }),
  skill({ id: 'dissonance', name: 'Dissonance', category: 'spell', rarity: 'epic', access: cls('bard'), cooldown: 6, target: foe('front', 'all'), fx: [dmg(0.6, magic('lightning')), debuff('magic', 0.4, 4)], synergy: { with: 'discord', bonus: 0.3 } }),
  skill({ id: 'crescendo', name: 'Crescendo', category: 'spell', rarity: 'legendary', access: cls('bard'), cooldown: 10, target: ally('front', 'all'), fx: [buff('attack', 0.5, 6), buff('magic', 0.5, 6)], prerequisite: 'inspire', vfx: 'blessing' }),
];

const warlock: SkillDef[] = [
  skill({ id: 'corruption', name: 'Corruption', category: 'spell', rarity: 'common', access: cls('warlock'), cooldown: 4, target: foe('highestHp'), fx: [dot(1, 5, { stat: 'magic', element: 'shadow' })] }),
  skill({ id: 'eldritchBlast', name: 'Eldritch Blast', category: 'spell', rarity: 'common', access: cls('warlock'), cooldown: 2.5, target: foe('front'), fx: [dmg(1, magic('shadow'))], synergy: { with: 'shadowBolt', bonus: 0.25 } }),
  skill({ id: 'agony', name: 'Agony', category: 'spell', rarity: 'rare', access: cls('warlock'), cooldown: 5, target: foe('front', 'row'), fx: [dot(1, 4, { stat: 'magic', element: 'shadow' })], synergy: { with: 'corruption', bonus: 0.3 } }),
  skill({ id: 'soulFire', name: 'Soul Fire', category: 'spell', rarity: 'epic', access: cls('warlock'), cooldown: 5, target: foe('highestHp'), fx: [dmg(0.7, magic('fire')), dot(0.3, 3, { stat: 'magic', element: 'fire' })], vfx: 'fireball' }),
  skill({ id: 'doom', name: 'Doom', category: 'spell', rarity: 'legendary', access: cls('warlock'), cooldown: 10, target: foe('front', 'all'), fx: [dot(0.7, 5, { stat: 'magic', element: 'shadow' }), debuff('resistance', 0.3, 5)], prerequisite: 'corruption' }),
];

export const SKILL_LIBRARY: SkillDef[] = [
  ...shared,
  ...SHARED_TRIGGERS,
  ...TAG_TRIGGERS,
  ...CLASS_TRIGGERS,
  ...tagged,
  ...knight,
  ...mage,
  ...cleric,
  ...rogue,
  ...ranger,
  ...barbarian,
  ...paladin,
  ...necromancer,
  ...druid,
  ...monk,
  ...bard,
  ...warlock,
  ...KNIGHT_ARCHETYPES,
  ...MAGE_ARCHETYPES,
  ...CLERIC_ARCHETYPES,
  ...ROGUE_ARCHETYPES,
  ...RANGER_ARCHETYPES,
  ...BARBARIAN_ARCHETYPES,
  ...PALADIN_ARCHETYPES,
  ...NECROMANCER_ARCHETYPES,
  ...DRUID_ARCHETYPES,
  ...MONK_ARCHETYPES,
  ...BARD_ARCHETYPES,
  ...WARLOCK_ARCHETYPES,
];

export const SKILLS_BY_ID: Record<string, SkillDef> = Object.fromEntries(SKILL_LIBRARY.map((s) => [s.id, s]));
