export type Side = 'party' | 'enemy';
export type DamageType = 'physical' | 'magic';
export type Category = 'skill' | 'spell';
export type StatKey = 'attack' | 'magic' | 'defense' | 'resistance';
export type Element = 'fire' | 'ice' | 'lightning' | 'holy' | 'shadow' | 'poison';
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export type Tag = 'martial' | 'caster' | 'heavy' | 'ranged' | 'holy' | 'arcane' | 'nature' | 'shadow';

export const ELEMENTS: Element[] = ['fire', 'ice', 'lightning', 'holy', 'shadow', 'poison'];
export const RARITIES: Rarity[] = ['common', 'rare', 'epic', 'legendary'];

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
  | {
      kind: 'damage';
      damageType: DamageType;
      stat: 'attack' | 'magic';
      scaling: number;
      element?: Element;
      hits?: number;
      drain?: number;
    }
  | { kind: 'barrier'; stat: 'defense' | 'resistance'; scaling: number; duration: number }
  | { kind: 'heal'; scaling: number }
  | { kind: 'regen'; scaling: number; duration: number }
  | { kind: 'dot'; stat: 'attack' | 'magic'; scaling: number; duration: number; element?: Element }
  | { kind: 'buff'; stat: StatKey; amount: number; duration: number }
  | { kind: 'debuff'; stat: StatKey; amount: number; duration: number };

export type SkillAccess = { kind: 'shared' } | { kind: 'tag'; tag: Tag } | { kind: 'class'; classId: string };

export interface SkillDef {
  id: string;
  name: string;
  category: Category;
  rarity: Rarity;
  access: SkillAccess;
  cooldown: number;
  target: Targeting;
  effects: SkillEffect[];
  prerequisite?: string;
  synergy?: { with: string; bonus: number };
  vfx?: string;
}

export interface CombatantDef {
  id: string;
  name: string;
  stats: Stats;
  skills: SkillDef[];
  tags?: Tag[];
  resist?: Partial<Record<Element, number>>;
}

export type EquipSlot = 'armor' | 'helmet' | 'boots' | 'weapon' | 'jewelry';
export const EQUIP_SLOTS: EquipSlot[] = ['armor', 'helmet', 'boots', 'weapon', 'jewelry'];

// Effects an enchantment can apply are the same shapes skills use (minus multi-target damage).
export type Enchantment =
  | { kind: 'onHit'; chance: number; effect: SkillEffect }
  | { kind: 'thorns'; fraction: number }
  | { kind: 'onHitTaken'; chance: number; effect: SkillEffect }
  | { kind: 'onAllyDeath'; effect: SkillEffect }
  | { kind: 'taunt' }
  | { kind: 'resist'; element: Element; amount: number };

export interface EquipmentDef {
  id: string;
  name: string;
  slot: EquipSlot;
  rarity: Rarity;
  stats: Partial<Stats>;
  requires?: Tag;
  enchantment?: Enchantment;
}

export type Equipment = Partial<Record<EquipSlot, EquipmentDef>>;

export interface PartyMember {
  def: CombatantDef;
  equipment: Equipment;
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

// Debuffs are buffs with a negative amount; both refresh per source rather than stack.
export interface Buff {
  source: string;
  stat: StatKey;
  amount: number;
  remaining: number;
}

export interface Ticking {
  source: string;
  owner: string;
  amount: number;
  element?: Element;
  remaining: number;
  tick: number;
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
  dots: Ticking[];
  regens: Ticking[];
  slots: SkillSlot[];
  damageDealt: number;
  lastAttacker: string | null;
  castSpell: boolean;
  castDefensive: boolean;
}

export type BattleResult = 'victory' | 'defeat';

export type BattleEvent =
  | { type: 'skill'; actor: string; skill: string; targets: string[] }
  | { type: 'damage'; source: string; target: string; amount: number; absorbed: number; element?: Element; periodic?: boolean }
  | { type: 'heal'; source: string; target: string; amount: number; periodic?: boolean }
  | { type: 'barrier'; target: string; amount: number }
  | { type: 'buff'; target: string; stat: StatKey; amount: number }
  | { type: 'death'; target: string }
  | { type: 'equipmentBroken'; target: string; slot: EquipSlot; item: string }
  | { type: 'end'; result: BattleResult };
