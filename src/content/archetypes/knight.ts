import type { SkillDef } from '../../combat/types';
import {
  ally,
  barrier,
  buff,
  cls,
  debuff,
  delay,
  dmg,
  foe,
  haste,
  regen,
  SELF,
  self,
  selfDamage,
  skill,
  taunt,
  type SkillSpec,
} from '../build';

type Spec = Omit<SkillSpec, 'access' | 'category'> & { category?: SkillSpec['category'] };
const k = (spec: Spec): SkillDef => skill({ category: 'skill', ...spec, access: cls('knight') });

const WHEN_HIT = { kind: 'whenHit' } as const;
const ON_DEFEAT = { kind: 'onDefeat' } as const;

// Sacrifice: power that comes from the knight falling or bleeding for his allies.
const sacrifice: SkillDef[] = [
  k({ id: 'martyrsVow', name: "Martyr's Vow", theme: 'sacrifice', rarity: 'common', cooldown: 10, trigger: ON_DEFEAT, target: ally('front', 'all'), fx: [barrier(1, 6)], vfx: 'blessing' }),
  k({ id: 'lastRites', name: 'Last Rites', theme: 'sacrifice', rarity: 'common', cooldown: 10, target: ally('front', 'all'), fx: [buff('attack', 0.7, 8), regen(0.3, 4)], vfx: 'blessing' }),
  k({ id: 'bloodOath', name: 'Blood Oath', theme: 'sacrifice', rarity: 'common', cooldown: 6, target: ally('front', 'all'), fx: [selfDamage(0.06), buff('defense', 1.1, 5)] }),
  k({ id: 'fallenStandard', name: 'Fallen Standard', theme: 'sacrifice', rarity: 'rare', cooldown: 10, target: ally('front', 'all'), fx: [haste(1, 6)], vfx: 'blessing' }),
  k({ id: 'selflessGuard', name: 'Selfless Guard', theme: 'sacrifice', rarity: 'rare', cooldown: 5, target: ally('lowestHpPct'), fx: [selfDamage(0.08), barrier(1.15, 4)] }),
  k({ id: 'heroicSacrifice', name: 'Heroic Sacrifice', theme: 'sacrifice', rarity: 'epic', cooldown: 10, target: ally('front', 'all'), fx: [barrier(0.6, 6), buff('attack', 0.4, 8)], vfx: 'blessing' }),
  k({ id: 'eternalVigil', name: 'Eternal Vigil', theme: 'sacrifice', rarity: 'legendary', cooldown: 10, target: ally('front', 'all'), fx: [barrier(0.6, 8), haste(0.4, 8)], prerequisite: 'martyrsVow', vfx: 'blessing' }),
];

// Guard: raise defense and protect others at the cost of the knight's own attack.
const guard: SkillDef[] = [
  k({ id: 'shieldUp', name: 'Shield Up', theme: 'guard', rarity: 'common', cooldown: 6, target: SELF, fx: [buff('defense', 1.25, 5), self(debuff('attack', 0.25, 5))] }),
  k({ id: 'bodyguard', name: 'Bodyguard', theme: 'guard', rarity: 'common', cooldown: 6, target: SELF, fx: [taunt(1)] }),
  k({ id: 'protect', name: 'Protect', theme: 'guard', rarity: 'common', cooldown: 5, target: ally('lowestHpPct'), fx: [barrier(1, 4)], synergy: { with: 'bodyguard', bonus: 0.3 } }),
  k({ id: 'phalanx', name: 'Phalanx', theme: 'guard', rarity: 'rare', cooldown: 8, target: ally('front', 'all'), fx: [buff('defense', 1.2, 6), self(debuff('attack', 0.2, 6))], vfx: 'blessing' }),
  k({ id: 'bulwarkStance', name: 'Bulwark Stance', theme: 'guard', rarity: 'rare', cooldown: 7, target: SELF, fx: [taunt(0.5), buff('defense', 0.5, 5)] }),
  k({ id: 'standFirm', name: 'Stand Firm', theme: 'guard', rarity: 'epic', cooldown: 8, target: SELF, fx: [barrier(0.6, 5), taunt(0.4)], synergy: { with: 'shieldUp', bonus: 0.3 } }),
  k({ id: 'sentinel', name: 'Sentinel', theme: 'guard', rarity: 'epic', cooldown: 9, target: ally('front', 'all'), fx: [barrier(1.3, 4), self(debuff('attack', 0.3, 6))], vfx: 'blessing' }),
];

// Honor: powers that only fill when the knight takes a hit.
const honor: SkillDef[] = [
  k({ id: 'riposte', name: 'Riposte', theme: 'honor', rarity: 'common', cooldown: 3, trigger: WHEN_HIT, target: foe('attackedMe'), fx: [dmg(0.7), self(taunt(0.3))] }),
  k({ id: 'counterstrike', name: 'Counterstrike', theme: 'honor', rarity: 'common', cooldown: 4, target: foe('attackedMe'), fx: [dmg(0.7), debuff('attack', 0.3, 4)] }),
  k({ id: 'steadfast', name: 'Steadfast', theme: 'honor', rarity: 'common', cooldown: 5, target: SELF, fx: [buff('defense', 1, 5)] }),
  k({ id: 'honorDuel', name: 'Honor Duel', theme: 'honor', rarity: 'rare', cooldown: 4, target: foe('attackedMe'), fx: [dmg(0.7), debuff('attack', 0.3, 4)], synergy: { with: 'riposte', bonus: 0.3 } }),
  k({ id: 'shieldRetort', name: 'Shield Retort', theme: 'honor', rarity: 'rare', cooldown: 3, target: foe('attackedMe'), fx: [dmg(0.7), self(buff('defense', 0.3, 4))] }),
  k({ id: 'knightsResolve', name: "Knight's Resolve", theme: 'honor', rarity: 'rare', cooldown: 6, trigger: WHEN_HIT, target: SELF, fx: [barrier(1, 4)] }),
  k({ id: 'oathkeeper', name: 'Oathkeeper', theme: 'honor', rarity: 'epic', cooldown: 5, target: foe('attackedMe', 'column'), fx: [dmg(1)], synergy: { with: 'steadfast', bonus: 0.3 } }),
  k({ id: 'honorBound', name: 'Honor Bound', theme: 'honor', rarity: 'legendary', cooldown: 4, target: foe('attackedMe'), fx: [dmg(0.8), self(barrier(0.2, 4))], prerequisite: 'riposte' }),
];

const general: SkillDef[] = [
  k({ id: 'lanceCharge', name: 'Lance Charge', theme: 'knight', rarity: 'common', cooldown: 3, target: foe('front'), fx: [dmg(0.75), delay(0.25)] }),
  k({ id: 'pommelStrike', name: 'Pommel Strike', theme: 'knight', rarity: 'common', cooldown: 3, target: foe('front'), fx: [dmg(0.7), delay(0.3)] }),
  k({ id: 'bannerCall', name: 'Banner Call', theme: 'knight', rarity: 'rare', cooldown: 8, target: ally('front', 'all'), fx: [buff('attack', 0.75, 6), self(taunt(0.25))], vfx: 'blessing' }),
];

export const KNIGHT_ARCHETYPES: SkillDef[] = [...sacrifice, ...guard, ...honor, ...general];
