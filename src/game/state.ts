import type { EquipmentDef, PartyMember, SkillDef } from '../combat/types';
import type { ClassDef } from '../content/classes';
import { ITEM_LIBRARY } from '../content/items';
import { SKILL_LIBRARY } from '../content/skills';

export interface Inventory {
  skills: SkillDef[];
  items: EquipmentDef[];
}

export interface GameState {
  party: PartyMember[];
  inventory: Inventory;
}

// Phase 3 test setup: no party until the roster picker runs, and one copy of every skill and item.
export function createState(): GameState {
  return { party: [], inventory: { skills: [...SKILL_LIBRARY], items: [...ITEM_LIBRARY] } };
}

// New recruits arrive with their class's starting skills and no equipment.
export function recruit(def: ClassDef): PartyMember {
  return { def, skills: [...def.skills], equipment: {} };
}
