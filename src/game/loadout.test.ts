import { describe, expect, it } from 'vitest';
import type { CombatantDef, EquipmentDef, PartyMember, SkillDef } from '../combat/types';
import { equipItemBlock, placeSkillBlock, removeSkillBlock } from './loadout';

function skill(id: string, extra: Partial<SkillDef> = {}): SkillDef {
  return {
    id,
    name: id.toUpperCase(),
    category: 'skill',
    rarity: 'common',
    access: { kind: 'shared' },
    cooldown: 1,
    target: { side: 'self' },
    effects: [],
    ...extra,
  };
}

const knight: CombatantDef = {
  id: 'knight',
  name: 'Knight',
  stats: { hp: 1, attack: 1, magic: 1, defense: 1, resistance: 1 },
  skills: [],
  tags: ['martial', 'heavy'],
};

const member = (skills: SkillDef[]): PartyMember => ({ def: knight, equipment: {}, skills });

describe('skill access', () => {
  it('allows shared skills, matching tags, and own-class skills', () => {
    const m = member([]);
    expect(placeSkillBlock(m, skill('a'), 0)).toBeNull();
    expect(placeSkillBlock(m, skill('b', { access: { kind: 'tag', tag: 'heavy' } }), 0)).toBeNull();
    expect(placeSkillBlock(m, skill('c', { access: { kind: 'class', classId: 'knight' } }), 0)).toBeNull();
  });

  it('blocks other tags and other classes', () => {
    const m = member([]);
    expect(placeSkillBlock(m, skill('b', { access: { kind: 'tag', tag: 'caster' } }), 0)).toBe('REQUIRES CASTER');
    expect(placeSkillBlock(m, skill('c', { access: { kind: 'class', classId: 'mage' } }), 0)).toBe('OTHER CLASS ONLY');
  });
});

describe('slots and duplicates', () => {
  it('allows one copy per character, but replacing a skill with itself is fine', () => {
    const m = member([skill('a'), skill('b')]);
    expect(placeSkillBlock(m, skill('a'), 2)).toBe('ALREADY EQUIPPED');
    expect(placeSkillBlock(m, skill('a'), 0)).toBeNull();
  });

  it('only appends into the next free slot, up to four', () => {
    expect(placeSkillBlock(member([skill('a')]), skill('b'), 3)).toBe('NO FREE SLOT');
    expect(placeSkillBlock(member([skill('a'), skill('b'), skill('c'), skill('d')]), skill('e'), 4)).toBe('NO FREE SLOT');
  });
});

describe('prerequisites', () => {
  const base = skill('base');
  const ultimate = skill('ultimate', { prerequisite: 'base' });

  it('cannot equip a skill without its prerequisite in another slot', () => {
    expect(placeSkillBlock(member([]), ultimate, 0)).toBe('NEEDS PREREQUISITE');
    expect(placeSkillBlock(member([base]), ultimate, 1)).toBeNull();
  });

  it('cannot replace the prerequisite with its own dependent', () => {
    expect(placeSkillBlock(member([base]), ultimate, 0)).toBe('NEEDS PREREQUISITE');
  });

  it('blocks removing or replacing a prerequisite while its dependent is equipped', () => {
    const m = member([base, ultimate]);
    expect(removeSkillBlock(m, 0)).toBe('ULTIMATE NEEDS IT');
    expect(placeSkillBlock(m, skill('other'), 0)).toBe('ULTIMATE NEEDS IT');
    expect(removeSkillBlock(m, 1)).toBeNull();
  });
});

describe('gear restrictions', () => {
  const plate: EquipmentDef = { id: 'plate', name: 'Plate', slot: 'armor', rarity: 'common', stats: {}, requires: 'heavy' };
  const staff: EquipmentDef = { id: 'staff', name: 'Staff', slot: 'weapon', rarity: 'common', stats: {}, requires: 'caster' };
  const ring: EquipmentDef = { id: 'ring', name: 'Ring', slot: 'jewelry', rarity: 'common', stats: {} };

  it('requires the item tag on the character', () => {
    const m = member([]);
    expect(equipItemBlock(m, plate)).toBeNull();
    expect(equipItemBlock(m, ring)).toBeNull();
    expect(equipItemBlock(m, staff)).toBe('REQUIRES CASTER');
  });
});
