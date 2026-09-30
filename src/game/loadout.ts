import type { EquipmentDef, PartyMember, SkillDef } from '../combat/types';

export const MAX_SKILLS = 4;

// Each check returns a player-facing reason when the action is not allowed, or null when it is.

export function skillAccessBlock(member: PartyMember, skill: SkillDef): string | null {
  const access = skill.access;
  if (access.kind === 'tag' && !member.def.tags?.includes(access.tag)) return `REQUIRES ${access.tag.toUpperCase()}`;
  if (access.kind === 'class' && access.classId !== member.def.id) return 'OTHER CLASS ONLY';
  return null;
}

// Placing into `slot` replaces whatever is there (slot === skills.length appends).
export function placeSkillBlock(member: PartyMember, skill: SkillDef, slot: number): string | null {
  if (slot > member.skills.length || slot >= MAX_SKILLS) return 'NO FREE SLOT';
  const access = skillAccessBlock(member, skill);
  if (access) return access;

  const others = member.skills.filter((_, i) => i !== slot);
  if (others.some((s) => s.id === skill.id)) return 'ALREADY EQUIPPED';
  if (skill.prerequisite && !others.some((s) => s.id === skill.prerequisite)) return 'NEEDS PREREQUISITE';

  const replaced = member.skills[slot];
  if (replaced) return removeSkillBlock(member, slot);
  return null;
}

export function removeSkillBlock(member: PartyMember, slot: number): string | null {
  const skill = member.skills[slot];
  if (!skill) return null;
  const dependent = member.skills.find((s, i) => i !== slot && s.prerequisite === skill.id);
  return dependent ? `${dependent.name} NEEDS IT` : null;
}

export function equipItemBlock(member: PartyMember, item: EquipmentDef): string | null {
  if (item.requires && !member.def.tags?.includes(item.requires)) return `REQUIRES ${item.requires.toUpperCase()}`;
  return null;
}
