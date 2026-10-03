import type { EquipmentDef, PartyMember, SkillDef } from '../combat/types';

export const MAX_SKILLS = 4;
// Slots 0–2 hold timed skills (kept in order, no gaps); slot 3 holds a trigger skill.
export const TIMED_SLOTS = 3;
export const TRIGGER_SLOT = 3;

// Every skill a hero has equipped, the trigger included.
export function equippedSkills(member: PartyMember): SkillDef[] {
  return member.trigger ? [...member.skills, member.trigger] : member.skills;
}

export function skillInSlot(member: PartyMember, slot: number): SkillDef | undefined {
  return slot === TRIGGER_SLOT ? (member.trigger ?? undefined) : member.skills[slot];
}

// Each check returns a player-facing reason when the action is not allowed, or null when it is.

export function skillAccessBlock(member: PartyMember, skill: SkillDef): string | null {
  const access = skill.access;
  if (access.kind === 'tag' && !member.def.tags?.includes(access.tag)) return `REQUIRES ${access.tag.toUpperCase()}`;
  if (access.kind === 'class' && access.classId !== member.def.id) return 'OTHER CLASS ONLY';
  return null;
}

// Placing into `slot` replaces whatever is there (a timed slot at skills.length appends).
export function placeSkillBlock(member: PartyMember, skill: SkillDef, slot: number): string | null {
  if (slot === TRIGGER_SLOT) {
    if (!skill.trigger) return 'TRIGGERS ONLY';
  } else {
    if (skill.trigger) return 'TRIGGER SLOT ONLY';
    if (slot > member.skills.length || slot >= TIMED_SLOTS) return 'NO FREE SLOT';
  }
  const access = skillAccessBlock(member, skill);
  if (access) return access;

  const replaced = skillInSlot(member, slot);
  const others = equippedSkills(member).filter((s) => s !== replaced);
  if (others.some((s) => s.id === skill.id)) return 'ALREADY EQUIPPED';
  if (skill.prerequisite && !others.some((s) => s.id === skill.prerequisite)) return 'NEEDS PREREQUISITE';

  if (replaced) return removeSkillBlock(member, slot);
  return null;
}

export function removeSkillBlock(member: PartyMember, slot: number): string | null {
  const skill = skillInSlot(member, slot);
  if (!skill) return null;
  const dependent = equippedSkills(member).find((s) => s !== skill && s.prerequisite === skill.id);
  return dependent ? `${dependent.name} NEEDS IT` : null;
}

export function equipItemBlock(member: PartyMember, item: EquipmentDef): string | null {
  if (item.requires && !member.def.tags?.includes(item.requires)) return `REQUIRES ${item.requires.toUpperCase()}`;
  return null;
}
