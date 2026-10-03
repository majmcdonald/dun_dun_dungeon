import type { EquipmentDef, PartyMember, SkillDef } from '../combat/types';
import type { ClassDef } from '../content/classes';
import { ITEM_LIBRARY } from '../content/items';
import { SKILL_LIBRARY } from '../content/skills';
import type { RunState } from '../run/run';

export interface Inventory {
  skills: SkillDef[];
  items: EquipmentDef[];
  // Debug screen: equipping never uses up a copy and unequipping never adds one.
  unlimited?: boolean;
}

export interface GameState {
  party: PartyMember[];
  inventory: Inventory;
  // The run in progress; null on the title screen and in the debug screen.
  run: RunState | null;
}

// Phase 3 test setup: no party until the roster picker runs, and one copy of every skill and item.
export function createState(): GameState {
  return { party: [], inventory: { skills: [...SKILL_LIBRARY], items: [...ITEM_LIBRARY] }, run: null };
}

// New recruits arrive with their class's starting skills in slots 1–2, no trigger, and no equipment.
export function recruit(def: ClassDef): PartyMember {
  return { def, skills: [...def.skills], trigger: null, equipment: {} };
}
