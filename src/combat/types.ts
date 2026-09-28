export type Side = 'party' | 'enemy';
export type DamageType = 'physical' | 'magic';

export interface Stats {
  hp: number;
  attack: number;
  magic: number;
  defense: number;
  resistance: number;
}

export type TargetRule = 'frontEnemy' | 'self';

export type SkillEffect =
  | { kind: 'damage'; damageType: DamageType; stat: 'attack' | 'magic'; scaling: number }
  | { kind: 'barrier'; stat: 'defense' | 'resistance'; scaling: number; duration: number };

export interface SkillDef {
  id: string;
  name: string;
  cooldown: number;
  target: TargetRule;
  effect: SkillEffect;
}

export interface CombatantDef {
  id: string;
  name: string;
  stats: Stats;
  skills: SkillDef[];
}

export interface SkillSlot {
  def: SkillDef;
  timer: number;
}

export interface Barrier {
  amount: number;
  remaining: number;
}

export interface Combatant {
  uid: string;
  def: CombatantDef;
  side: Side;
  position: number;
  hp: number;
  barrier: Barrier | null;
  slots: SkillSlot[];
}

export type BattleResult = 'victory' | 'defeat';

export type BattleEvent =
  | { type: 'skill'; actor: string; skill: string }
  | { type: 'damage'; source: string; target: string; amount: number; absorbed: number }
  | { type: 'barrier'; target: string; amount: number }
  | { type: 'death'; target: string }
  | { type: 'end'; result: BattleResult };
