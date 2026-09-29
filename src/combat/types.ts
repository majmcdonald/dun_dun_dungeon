export type Side = 'party' | 'enemy';
export type DamageType = 'physical' | 'magic';
export type Category = 'skill' | 'spell';
export type StatKey = 'attack' | 'magic' | 'defense' | 'resistance';

export interface Stats {
  hp: number;
  attack: number;
  magic: number;
  defense: number;
  resistance: number;
}

export type Selector =
  | 'front'
  | 'back'
  | 'random'
  | 'lowestHpPct'
  | 'highestHpPct'
  | 'lowestHp'
  | 'highestHp'
  | 'attackedMe'
  | 'mostDamage'
  | 'castSpell'
  | 'castDefensive';

export type Area = 'single' | 'row' | 'column' | 'all';

export type Targeting = { side: 'self' } | { side: 'enemy' | 'ally'; select: Selector; area: Area };

export type SkillEffect =
  | { kind: 'damage'; damageType: DamageType; stat: 'attack' | 'magic'; scaling: number }
  | { kind: 'barrier'; stat: 'defense' | 'resistance'; scaling: number; duration: number }
  | { kind: 'heal'; scaling: number }
  | { kind: 'buff'; stat: StatKey; amount: number; duration: number };

export interface SkillDef {
  id: string;
  name: string;
  category: Category;
  cooldown: number;
  target: Targeting;
  effect: SkillEffect;
  vfx?: string;
}

export interface CombatantDef {
  id: string;
  name: string;
  stats: Stats;
  skills: SkillDef[];
}

export type EquipSlot = 'armor' | 'helmet' | 'boots' | 'weapon' | 'jewelry';
export const EQUIP_SLOTS: EquipSlot[] = ['armor', 'helmet', 'boots', 'weapon', 'jewelry'];

export interface EquipmentDef {
  id: string;
  name: string;
  slot: EquipSlot;
  stats: Partial<Stats>;
  taunt?: boolean;
}

export type Equipment = Partial<Record<EquipSlot, EquipmentDef>>;

export interface PartyMember {
  def: CombatantDef;
  equipment: Equipment;
}

export interface SkillSlot {
  def: SkillDef;
  timer: number;
}

export interface Barrier {
  amount: number;
  remaining: number;
}

export interface Buff {
  skill: string;
  stat: StatKey;
  amount: number;
  remaining: number;
}

export interface Combatant {
  uid: string;
  def: CombatantDef;
  side: Side;
  position: number;
  equipment: Equipment;
  maxHp: number;
  hp: number;
  barrier: Barrier | null;
  buffs: Buff[];
  slots: SkillSlot[];
  damageDealt: number;
  lastAttacker: string | null;
  castSpell: boolean;
  castDefensive: boolean;
}

export type BattleResult = 'victory' | 'defeat';

export type BattleEvent =
  | { type: 'skill'; actor: string; skill: string; targets: string[] }
  | { type: 'damage'; source: string; target: string; amount: number; absorbed: number }
  | { type: 'heal'; source: string; target: string; amount: number }
  | { type: 'barrier'; target: string; amount: number }
  | { type: 'buff'; target: string; stat: StatKey; amount: number }
  | { type: 'death'; target: string }
  | { type: 'equipmentBroken'; target: string; slot: EquipSlot; item: string }
  | { type: 'end'; result: BattleResult };
