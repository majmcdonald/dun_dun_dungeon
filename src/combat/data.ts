import type { CombatantDef, SkillDef } from './types';

export const SKILLS = {
  slash: {
    id: 'slash',
    name: 'Slash',
    cooldown: 2.0,
    target: 'frontEnemy',
    effect: { kind: 'damage', damageType: 'physical', stat: 'attack', scaling: 1.5 },
  },
  shieldBash: {
    id: 'shieldBash',
    name: 'Shield Bash',
    cooldown: 4.0,
    target: 'frontEnemy',
    effect: { kind: 'damage', damageType: 'physical', stat: 'attack', scaling: 1.0 },
  },
  ironGuard: {
    id: 'ironGuard',
    name: 'Iron Guard',
    cooldown: 6.0,
    target: 'self',
    effect: { kind: 'barrier', stat: 'defense', scaling: 1.0, duration: 4.0 },
  },
  bounce: {
    id: 'bounce',
    name: 'Bounce',
    cooldown: 1.5,
    target: 'frontEnemy',
    effect: { kind: 'damage', damageType: 'physical', stat: 'attack', scaling: 1.0 },
  },
} satisfies Record<string, SkillDef>;

export const KNIGHT: CombatantDef = {
  id: 'knight',
  name: 'Knight',
  stats: { hp: 120, attack: 15, magic: 0, defense: 20, resistance: 10 },
  skills: [SKILLS.slash, SKILLS.shieldBash, SKILLS.ironGuard],
};

export const SLIME: CombatantDef = {
  id: 'slime',
  name: 'Slime',
  stats: { hp: 80, attack: 12, magic: 0, defense: 5, resistance: 5 },
  skills: [SKILLS.bounce],
};
