export type Side = 'party' | 'enemy';
export type DamageType = 'physical' | 'magic';
export type Category = 'skill' | 'spell';
export type StatKey = 'attack' | 'magic' | 'defense' | 'resistance';
export type Element = 'fire' | 'ice' | 'lightning' | 'holy' | 'shadow' | 'poison';
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export type Tag = 'martial' | 'caster' | 'heavy' | 'ranged' | 'holy' | 'arcane' | 'nature' | 'shadow';
export type Mechanic = 'rage' | 'souls' | 'chi' | 'familiar';

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

// 'summons' targets the caster's own summons (e.g. a warlock feeding his familiar).
export type Targeting =
  | { side: 'self' }
  | { side: 'enemy' | 'ally'; select: Selector; area: Area }
  | { side: 'summons'; area: 'single' | 'all' };

type BaseEffect =
  | {
      kind: 'damage';
      damageType: DamageType;
      stat: 'attack' | 'magic';
      scaling: number;
      element?: Element;
      hits?: number;
      drain?: number;
      // Zealot: multiplier bonus against enemies that have cast a spell, penalty against everyone else.
      vsCasters?: { bonus: number; penalty: number };
    }
  | { kind: 'barrier'; stat: 'defense' | 'resistance'; scaling: number; duration: number }
  | { kind: 'heal'; scaling: number }
  | { kind: 'regen'; scaling: number; duration: number }
  | { kind: 'dot'; stat: 'attack' | 'magic'; scaling: number; duration: number; element?: Element }
  | { kind: 'buff'; stat: StatKey; amount: number; duration: number }
  | { kind: 'debuff'; stat: StatKey; amount: number; duration: number }
  | { kind: 'speed'; factor: number; duration: number }
  | { kind: 'summon'; creature: string; share: number }
  | { kind: 'transform'; duration: number }
  | { kind: 'steal' }
  | { kind: 'siphon'; stat: StatKey; amount: number; duration: number }
  | { kind: 'gold'; amount: number }
  | { kind: 'taunt'; duration: number }
  | { kind: 'delay'; seconds: number }
  | { kind: 'selfDamage'; fraction: number }
  | { kind: 'chaos'; options: SkillEffect[] }
  | { kind: 'shapeshift'; duration: number; bonus: number }
  | { kind: 'meter'; amount: number }
  | { kind: 'consumeSummon' };

// `self` applies the effect once to the caster instead of to each target (e.g. "hit them, lower my ATK");
// `onSummons` applies it to each of the caster's summons (e.g. "hit them, empower my familiar").
export type SkillEffect = BaseEffect & { self?: boolean; onSummons?: boolean };

export type SkillAccess = { kind: 'shared' } | { kind: 'tag'; tag: Tag } | { kind: 'class'; classId: string };

// Event skills only advance their timer when the event happens (or while the state holds).
export type Trigger =
  | { kind: 'whenHit'; perEvent: number }
  | { kind: 'allyHurt'; perEvent: number }
  | { kind: 'partyLow'; threshold: number }
  | { kind: 'onDefeat' };

// Conditional skills fill their timer, then wait until the condition holds.
export type Condition =
  | { kind: 'frenzy' }
  | { kind: 'souls'; cost: number }
  | { kind: 'onlyJewelry' }
  | { kind: 'chiBurst' }
  | { kind: 'chiFilling' }
  | { kind: 'hasSummon' }
  | { kind: 'shapeshifted' };

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
  theme?: string;
  trigger?: Trigger;
  condition?: Condition;
  // Glory: effect power grows by this fraction per 5 seconds of battle.
  glory?: number;
  // Shapeshift attacks keep running (and get the form's bonus) while the Druid is shapeshifted.
  form?: boolean;
}

export interface CombatantDef {
  id: string;
  name: string;
  stats: Stats;
  skills: SkillDef[];
  tags?: Tag[];
  resist?: Partial<Record<Element, number>>;
  mechanic?: Mechanic;
  familiar?: string;
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
  // Set when a store has enchanted this copy: the bonus is already included in `stats`.
  boost?: { stat: keyof Stats; amount: number };
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

// Debuffs are buffs with a negative amount; both refresh per source and stat rather than stack.
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

export interface Timed {
  source: string;
  value: number;
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
  dots: Ticking[];
  regens: Ticking[];
  speed: Timed[];
  slots: SkillSlot[];
  damageDealt: number;
  lastAttacker: string | null;
  castSpell: boolean;
  castDefensive: boolean;
  summoner: string | null;
  familiar: boolean;
  transformed: number;
  taunting: number;
  shapeshift: { remaining: number; bonus: number } | null;
  channel: number;
  meter: number;
  burst: number;
}

export type BattleResult = 'victory' | 'defeat';

export type BattleEvent =
  | { type: 'skill'; actor: string; skill: string; targets: string[] }
  | { type: 'damage'; source: string; target: string; amount: number; absorbed: number; element?: Element; periodic?: boolean }
  | { type: 'heal'; source: string; target: string; amount: number; periodic?: boolean }
  | { type: 'barrier'; target: string; amount: number }
  | { type: 'buff'; target: string; stat: StatKey; amount: number }
  | { type: 'status'; target: string; status: 'slow' | 'haste' | 'transform' | 'taunt' | 'shapeshift' | 'frenzy' | 'burst' | 'steal' | 'delay' }
  | { type: 'summon'; summoner: string; unit: string }
  | { type: 'gold'; amount: number }
  | { type: 'death'; target: string }
  | { type: 'equipmentBroken'; target: string; slot: EquipSlot; item: string }
  | { type: 'end'; result: BattleResult };
