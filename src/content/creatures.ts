import type { CombatantDef, SkillDef, SkillEffect, Targeting } from '../combat/types';

// Summoned creatures. Their stats are placeholders: the battle rescales every stat from the summoner
// when the creature is called. Their abilities never appear in the player's skill library.
function ability(id: string, name: string, cooldown: number, target: Targeting, effects: SkillEffect[], spell = false): SkillDef {
  return { id, name, category: spell ? 'spell' : 'skill', rarity: 'common', access: { kind: 'shared' }, cooldown, target, effects };
}

const front: Targeting = { side: 'enemy', select: 'front', area: 'single' };
const random: Targeting = { side: 'enemy', select: 'random', area: 'single' };
const self: Targeting = { side: 'self' };
const physical = (scaling: number): SkillEffect => ({ kind: 'damage', damageType: 'physical', stat: 'attack', scaling });
const BLANK = { hp: 1, attack: 1, magic: 1, defense: 1, resistance: 1 };

function creature(id: string, name: string, skills: SkillDef[]): CombatantDef {
  return { id, name, stats: BLANK, skills };
}

export const CREATURES: Record<string, CombatantDef> = {
  wolf: creature('wolf', 'Wolf', [ability('wolfBite', 'Bite', 1.5, front, [physical(1)])]),
  hawk: creature('hawk', 'Hawk', [ability('hawkPeck', 'Peck', 1.2, random, [physical(0.8)])]),
  bear: creature('bear', 'Bear', [
    ability('bearMaul', 'Maul', 2.5, front, [physical(1.5)]),
    ability('bearRoar', 'Roar', 6, self, [{ kind: 'taunt', duration: 3 }]),
  ]),
  boar: creature('boar', 'Boar', [ability('boarGore', 'Gore', 2, front, [physical(1.2)])]),
  owl: creature('owl', 'Owl', [
    ability('owlDive', 'Dive', 1.5, random, [physical(0.8)]),
    ability('owlScreech', 'Screech', 6, front, [{ kind: 'delay', seconds: 1 }]),
  ]),
  imp: creature('imp', 'Imp', [
    ability('impFirebolt', 'Firebolt', 2, random, [{ kind: 'damage', damageType: 'magic', stat: 'magic', scaling: 1, element: 'fire' }], true),
  ]),
  skeleton: creature('skeleton', 'Skeleton', [ability('skeletonSlash', 'Slash', 2, front, [physical(1)])]),
  zombie: creature('zombie', 'Zombie', [
    ability('zombieBite', 'Bite', 3, front, [physical(1)]),
    ability('zombieShamble', 'Shamble', 8, self, [{ kind: 'taunt', duration: 4 }]),
  ]),
  wraith: creature('wraith', 'Wraith', [
    ability('wraithTouch', 'Touch', 2.5, random, [{ kind: 'damage', damageType: 'magic', stat: 'magic', scaling: 1.2, element: 'shadow' }], true),
  ]),
};
