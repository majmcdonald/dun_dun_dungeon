import { describe, expect, it } from 'vitest';
import { gearBudgetRatio, skillBudgetRatio } from '../game/balance';
import { placeSkillBlock, skillAccessBlock } from '../game/loadout';
import { recruit } from '../game/state';
import { EVENT_ART } from '../art/eventArt';
import { SPRITES } from '../art/sprites';
import { canDraw } from '../ui/font';
import { CLASSES } from './classes';
import { ITEM_LIBRARY } from './items';
import { Battle } from '../combat/battle';
import type { SkillEffect } from '../combat/types';
import { CREATURES } from './creatures';
import { SKILL_LIBRARY, SKILLS_BY_ID } from './skills';
import { ENEMIES } from './enemies';
import { EVENT_LIBRARY } from './events';
import { wrap } from '../ui/describeLines';

describe('skill library', () => {
  it('has about 100 skills with unique ids', () => {
    expect(SKILL_LIBRARY.length).toBe(457);
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

  it.each(CLASSES.map((c) => [c.id] as const))('%s has 30 timed class skills and 3 class triggers', (id) => {
    const own = SKILL_LIBRARY.filter((s) => s.access.kind === 'class' && s.access.classId === id);
    const triggers = own.filter((s) => s.trigger);
    expect(triggers).toHaveLength(3);
    // Knight, Paladin, and Cleric turned 3 of their original 30 into triggers; the others gained new ones.
    expect(own.length - triggers.length).toBe(['knight', 'paladin', 'cleric'].includes(id) ? 27 : id === 'bard' ? 29 : 30);
  });

  it('every creature and the transform critter have a sprite', () => {
    for (const id of [...Object.keys(CREATURES), 'critter']) expect(SPRITES, id).toHaveProperty(id);
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

describe('events', () => {
  const enemyIds = new Set(ENEMIES.map((e) => e.id));
  const fits = (text: string, chars: number, lines: number) => wrap(text, chars).length <= lines;

  it('each have their own illustration', () => {
    for (const e of EVENT_LIBRARY) expect(EVENT_ART[e.art], e.id).toBeDefined();
    expect(new Set(EVENT_LIBRARY.map((e) => e.art)).size).toBe(EVENT_LIBRARY.length);
  });

  it('have unique ids and 2–3 choices', () => {
    expect(EVENT_LIBRARY.length).toBeGreaterThanOrEqual(15);
    expect(new Set(EVENT_LIBRARY.map((e) => e.id)).size).toBe(EVENT_LIBRARY.length);
    for (const e of EVENT_LIBRARY) {
      expect(e.choices.length, e.id).toBeGreaterThanOrEqual(2);
      expect(e.choices.length, e.id).toBeLessThanOrEqual(3);
    }
  });

  it('give every rolled choice a failure, and fight only real enemies', () => {
    for (const e of EVENT_LIBRARY) {
      for (const c of e.choices) {
        const rolled = c.check !== undefined || c.chance !== undefined;
        expect(!!c.failure, `${e.id}: ${c.label}`).toBe(rolled);
        for (const r of [c.success, c.failure].filter(Boolean)) {
          for (const o of r!.outcomes) if (o.kind === 'fight') for (const id of o.enemies ?? []) expect(enemyIds.has(id), id).toBe(true);
        }
      }
    }
  });

  // Buying something must be affordable; plain penalties (dropping coins while fleeing) need no cost.
  it('charge a cost for any choice that pays gold for a gain', () => {
    const gains = new Set(['skill', 'item', 'blessed']);
    for (const e of EVENT_LIBRARY) {
      for (const c of e.choices) {
        const paid = -Math.min(0, ...c.success.outcomes.map((o) => (o.kind === 'gold' ? o.amount : 0)));
        const buys = c.success.outcomes.some((o) => gains.has(o.kind));
        if (paid > 0 && buys) expect(c.cost ?? 0, `${e.id}: ${c.label}`).toBeGreaterThanOrEqual(paid);
      }
    }
  });

  it('use only drawable text that fits the event screen', () => {
    for (const e of EVENT_LIBRARY) {
      expect(canDraw(e.title) && fits(e.title, 70, 1), e.id).toBe(true);
      expect(canDraw(e.text) && fits(e.text, 57, 5), e.id).toBe(true);
      for (const c of e.choices) {
        expect(canDraw(c.label) && c.label.length <= 40, c.label).toBe(true);
        for (const r of [c.success, c.failure].filter(Boolean)) expect(canDraw(r!.text) && fits(r!.text, 70, 2), r!.text).toBe(true);
      }
    }
  });
});
