import { describe, expect, it } from 'vitest';
import { gearBudgetRatio, skillBudgetRatio } from '../game/balance';
import { placeSkillBlock, skillAccessBlock } from '../game/loadout';
import { recruit } from '../game/state';
import { SPRITES } from '../art/sprites';
import { canDraw } from '../ui/font';
import { CLASSES } from './classes';
import { ITEM_LIBRARY } from './items';
import { Battle } from '../combat/battle';
import type { SkillEffect } from '../combat/types';
import { CREATURES } from './creatures';
import { SKILL_LIBRARY, SKILLS_BY_ID } from './skills';

describe('skill library', () => {
  it('has about 100 skills with unique ids', () => {
    expect(SKILL_LIBRARY.length).toBe(400);
    expect(new Set(SKILL_LIBRARY.map((s) => s.id)).size).toBe(SKILL_LIBRARY.length);
  });

  it.each(SKILL_LIBRARY.map((s) => [s.id, s] as const))('%s is within 15%% of its rarity budget', (_id, s) => {
    const ratio = skillBudgetRatio(s);
    expect(ratio, `${s.id} ratio ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(0.85);
    expect(ratio, `${s.id} ratio ${ratio.toFixed(2)}`).toBeLessThanOrEqual(1.15);
  });

  it('prerequisites and synergy partners exist and are usable by the same class', () => {
    for (const s of SKILL_LIBRARY) {
      for (const ref of [s.prerequisite, s.synergy?.with].filter(Boolean) as string[]) {
        const other = SKILLS_BY_ID[ref];
        expect(other, `${s.id} → ${ref}`).toBeDefined();
        if (s.access.kind === 'class' && other.access.kind === 'class') expect(other.access.classId).toBe(s.access.classId);
      }
    }
  });

  it('every synergy partner is equippable by some class that can use the boosted skill', () => {
    for (const s of SKILL_LIBRARY.filter((x) => x.synergy)) {
      const partner = SKILLS_BY_ID[s.synergy!.with];
      const canUse = (c: (typeof CLASSES)[number], skill: typeof s) => skillAccessBlock(recruit(c), skill) === null;
      const both = CLASSES.filter((c) => canUse(c, s) && canUse(c, partner));
      expect(both.length, `${s.id} + ${partner.id}`).toBeGreaterThan(0);
    }
  });

  it('synergy bonuses stay within +25-40%', () => {
    for (const s of SKILL_LIBRARY.filter((x) => x.synergy)) {
      expect(s.synergy!.bonus, s.id).toBeGreaterThanOrEqual(0.25);
      expect(s.synergy!.bonus, s.id).toBeLessThanOrEqual(0.4);
    }
  });

  it('every prerequisite skill is Legendary', () => {
    for (const s of SKILL_LIBRARY.filter((x) => x.prerequisite)) expect(s.rarity, s.id).toBe('legendary');
  });
});

describe('item library', () => {
  it('has 60 items, 12 per slot, with unique ids', () => {
    expect(ITEM_LIBRARY).toHaveLength(60);
    expect(new Set(ITEM_LIBRARY.map((i) => i.id)).size).toBe(60);
    for (const slot of ['armor', 'helmet', 'boots', 'weapon', 'jewelry']) {
      expect(ITEM_LIBRARY.filter((i) => i.slot === slot), slot).toHaveLength(12);
    }
  });

  it.each(ITEM_LIBRARY.map((i) => [i.id, i] as const))('%s matches its rarity stat budget', (_id, item) => {
    expect(gearBudgetRatio(item)).toBeCloseTo(1, 1);
  });

  it('only and always Epic/Legendary items are enchanted', () => {
    for (const item of ITEM_LIBRARY) {
      const high = item.rarity === 'epic' || item.rarity === 'legendary';
      expect(Boolean(item.enchantment), item.id).toBe(high);
    }
  });
});

describe('classes', () => {
  it('has 12 classes, 6 available at the start', () => {
    expect(CLASSES).toHaveLength(12);
    expect(CLASSES.filter((c) => c.starting)).toHaveLength(6);
  });

  it.each(CLASSES.map((c) => [c.id, c] as const))('%s starts with a legal loadout of Common skills', (_id, c) => {
    const member = { ...recruit(c), skills: [] as typeof c.skills };
    c.skills.forEach((s, i) => {
      expect(s.rarity).toBe('common');
      expect(placeSkillBlock(member, s, i), s.id).toBeNull();
      member.skills.push(s);
    });
  });

  it('every class has a sprite', () => {
    for (const c of CLASSES) expect(SPRITES, c.id).toHaveProperty(c.id);
  });

  it.each(CLASSES.map((c) => [c.id] as const))('%s has 30 class skills', (id) => {
    const own = SKILL_LIBRARY.filter((s) => s.access.kind === 'class' && s.access.classId === id);
    expect(own).toHaveLength(30);
  });

  it('every familiar is a known creature', () => {
    for (const c of CLASSES.filter((x) => x.familiar)) expect(CREATURES, c.id).toHaveProperty(c.familiar!);
  });
});

describe('text', () => {
  it('every name can be drawn with the pixel font', () => {
    const names = [...SKILL_LIBRARY.map((s) => s.name), ...ITEM_LIBRARY.map((i) => i.name), ...CLASSES.map((c) => c.name)];
    for (const n of names) expect(canDraw(n), n).toBe(true);
  });
});

describe('summons', () => {
  const summonEffects = (effects: SkillEffect[]): SkillEffect[] =>
    effects.flatMap((e) => (e.kind === 'chaos' ? summonEffects(e.options) : e.kind === 'summon' ? [e] : []));

  it('every summon names a known creature', () => {
    for (const s of SKILL_LIBRARY) {
      for (const e of summonEffects(s.effects)) {
        if (e.kind === 'summon') expect(CREATURES, `${s.id} → ${e.creature}`).toHaveProperty(e.creature);
      }
    }
  });

  it("the ranger's Call Wolf brings a wolf into the fight", () => {
    const ranger = CLASSES.find((c) => c.id === 'ranger')!;
    const party = [{ ...recruit(ranger), skills: [SKILLS_BY_ID.callWolf] }];
    const target = { id: 'dummy', name: 'dummy', stats: { hp: 9999, attack: 0, magic: 0, defense: 0, resistance: 0 }, skills: [] };
    const battle = new Battle(party, [target], () => 0, { creatures: CREATURES });
    for (let i = 0; i < 10.1 * 60; i++) battle.tick(1 / 60);
    const wolf = battle.combatants.find((c) => c.summoner === 'party-0');
    expect(wolf?.def.id).toBe('wolf');
  });

  it('the warlock summons his imp after a 5 second channel', () => {
    const warlock = CLASSES.find((c) => c.id === 'warlock')!;
    const target = { id: 'dummy', name: 'dummy', stats: { hp: 9999, attack: 0, magic: 0, defense: 0, resistance: 0 }, skills: [] };
    const battle = new Battle([recruit(warlock)], [target], () => 0, { creatures: CREATURES });
    for (let i = 0; i < 4.9 * 60; i++) battle.tick(1 / 60);
    expect(battle.combatants.some((c) => c.familiar)).toBe(false);
    for (let i = 0; i < 0.2 * 60; i++) battle.tick(1 / 60);
    expect(battle.combatants.find((c) => c.familiar)?.def.id).toBe('imp');
  });
});
