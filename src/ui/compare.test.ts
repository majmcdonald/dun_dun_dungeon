import { describe, expect, it } from 'vitest';
import { CLASSES_BY_ID } from '../content/classes';
import { ITEM_LIBRARY } from '../content/items';
import { SKILL_LIBRARY, SKILLS_BY_ID } from '../content/skills';
import { recruit } from '../game/state';
import { compareColumns } from './compare';

const texts = (lines: { text: string }[]) => lines.map((l) => l.text);

describe('compare popup', () => {
  const knight = recruit(CLASSES_BY_ID.knight);
  const mage = recruit(CLASSES_BY_ID.mage);

  it('shows the current item and each stat change for every hero who can wear it', () => {
    const [current, next] = ITEM_LIBRARY.filter((i) => i.slot === 'armor' && !i.requires && !i.enchantment);
    const columns = compareColumns([{ ...knight, equipment: { armor: current } }, mage], { kind: 'item', item: next });
    expect(columns).toHaveLength(2);
    expect(texts(columns[0]).slice(0, 2)).toEqual(['KNIGHT', current.name.toUpperCase()]);
    expect(texts(columns[1])[1]).toBe('EMPTY');
    const def = (next.stats.defense ?? 0) - (current.stats.defense ?? 0);
    if (def !== 0) expect(texts(columns[0])).toContain(`DEF ${def > 0 ? '+' : ''}${def}`);
  });

  it("lists a hero's timed skills, with free slots", () => {
    const skill = SKILL_LIBRARY.find((s) => s.access.kind === 'shared' && !s.trigger && !s.prerequisite && !s.synergy)!;
    const [column] = compareColumns([knight], { kind: 'skill', skill });
    expect(texts(column)).toEqual(['KNIGHT', ...knight.skills.map((s) => s.name.toUpperCase()), 'FREE']);
  });

  it('shows the synergy partner and a missing prerequisite', () => {
    const synergy = SKILL_LIBRARY.find((s) => s.synergy && !s.trigger && !s.prerequisite && s.access.kind === 'class')!;
    const owner = recruit(CLASSES_BY_ID[(synergy.access as { classId: string }).classId]);
    const partner = SKILLS_BY_ID[synergy.synergy!.with];
    const withPartner = { ...owner, skills: partner.trigger ? owner.skills : [partner], trigger: partner.trigger ? partner : owner.trigger };
    expect(texts(compareColumns([withPartner], { kind: 'skill', skill: synergy })[0]).join('|')).toContain(`FROM ${partner.name.toUpperCase()}`);

    const gated = SKILL_LIBRARY.find((s) => s.prerequisite && s.access.kind === 'class')!;
    const student = { ...recruit(CLASSES_BY_ID[(gated.access as { classId: string }).classId]), skills: [], trigger: null };
    const needs = SKILLS_BY_ID[gated.prerequisite!].name.toUpperCase();
    expect(texts(compareColumns([student], { kind: 'skill', skill: gated })[0])).toContain(`NEEDS ${needs}`);
    const learned = { ...student, skills: [SKILLS_BY_ID[gated.prerequisite!]] };
    expect(texts(compareColumns([learned], { kind: 'skill', skill: gated })[0])).toContain(`HAS ${needs}`);
  });
});
