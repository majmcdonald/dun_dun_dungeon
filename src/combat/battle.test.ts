import { describe, expect, it } from 'vitest';
import { seededRng } from '../engine/random';
import { Battle, mitigate, statOf } from './battle';
import { TEST_ENCOUNTER } from '../content/enemies';
import { testParty } from '../content/testing';
import type { Area, BattleEvent, CombatantDef, EquipmentDef, PartyMember, Selector, SkillDef, Stats } from './types';

const DT = 1 / 60;
const NO_JITTER = () => 0;

function runFor(battle: Battle, seconds: number): BattleEvent[] {
  const events: BattleEvent[] = [];
  const ticks = Math.round(seconds / DT);
  for (let i = 0; i < ticks; i++) events.push(...battle.tick(DT));
  return events;
}

function runToEnd(battle: Battle, maxSeconds = 300): BattleEvent[] {
  const events: BattleEvent[] = [];
  while (!battle.result && battle.elapsed < maxSeconds) events.push(...battle.tick(DT));
  return events;
}

const BASE: Stats = { hp: 100, attack: 10, magic: 10, defense: 0, resistance: 0 };

function unit(id: string, stats: Partial<Stats> = {}, skills: SkillDef[] = []): CombatantDef {
  return { id, name: id, stats: { ...BASE, ...stats }, skills };
}

function member(def: CombatantDef, equipment: PartyMember['equipment'] = {}): PartyMember {
  return { def, equipment, skills: def.skills };
}

function hit(id: string, select: Selector, area: Area = 'single', cooldown = 1): SkillDef {
  return {
    id,
    name: id,
    category: 'skill',
    rarity: 'common',
    access: { kind: 'shared' },
    cooldown,
    target: { side: 'enemy', select, area },
    effects: [{ kind: 'damage', damageType: 'physical', stat: 'attack', scaling: 1 }],
  };
}

const slash = hit('slash', 'front', 'single', 2);
const guard: SkillDef = {
  id: 'guard',
  name: 'guard',
  category: 'skill',
  rarity: 'common',
  access: { kind: 'shared' },
  cooldown: 6,
  target: { side: 'self' },
  effects: [{ kind: 'barrier', stat: 'defense', scaling: 1, duration: 4 }],
};

function targetIds(battle: Battle, actorUid: string, skill: SkillDef): string[] {
  return battle.resolveTargets(battle.get(actorUid), skill).map((c) => c.uid);
}

describe('mitigate', () => {
  it('applies percentage mitigation', () => {
    expect(mitigate(22.5, 5)).toBe(21);
    expect(mitigate(12, 20)).toBe(10);
  });

  it('never deals less than 1', () => {
    expect(mitigate(1, 10000)).toBe(1);
  });
});

describe('timers', () => {
  it('fires a skill exactly when its cooldown elapses', () => {
    const battle = new Battle([member(unit('a', {}, [slash]))], [unit('b', { hp: 9999 })], NO_JITTER);
    expect(runFor(battle, 1.99).some((e) => e.type === 'skill')).toBe(false);
    expect(runFor(battle, 0.02).some((e) => e.type === 'skill')).toBe(true);
  });

  it('delays each first activation by less than 200ms', () => {
    const battle = new Battle([member(unit('a', {}, [slash]))], [unit('b', { hp: 9999 })], () => 0.999);
    expect(runFor(battle, 2.0).some((e) => e.type === 'skill')).toBe(false);
    expect(runFor(battle, 0.2).some((e) => e.type === 'skill')).toBe(true);
  });

  it('runs slot timers independently and in parallel', () => {
    const skills = [slash, hit('bash', 'front', 'single', 4), guard];
    const battle = new Battle([member(unit('a', {}, skills))], [unit('b', { hp: 9999 })], NO_JITTER);
    const events = runFor(battle, 12);
    const count = (id: string) => events.filter((e) => e.type === 'skill' && e.skill === id).length;
    expect([count('slash'), count('bash'), count('guard')]).toEqual([6, 3, 2]);
  });
});

describe('selectors', () => {
  const nine = (overrides: Partial<Stats>[] = []) =>
    Array.from({ length: 9 }, (_, i) => unit(`e${i}`, overrides[i] ?? {}));

  function setup(enemies = nine(), rng = NO_JITTER) {
    return new Battle([member(unit('p0')), member(unit('p1')), member(unit('p2'))], enemies, rng);
  }

  it('front picks the lowest living position, switching when it dies', () => {
    const battle = setup();
    expect(targetIds(battle, 'party-0', hit('x', 'front'))).toEqual(['enemy-0']);
    battle.get('enemy-0').hp = 0;
    expect(targetIds(battle, 'party-0', hit('x', 'front'))).toEqual(['enemy-1']);
  });

  it('back picks the highest living position', () => {
    const battle = setup();
    expect(targetIds(battle, 'party-0', hit('x', 'back'))).toEqual(['enemy-8']);
    expect(targetIds(battle, 'enemy-0', hit('x', 'back'))).toEqual(['party-2']);
  });

  it('random uses the injected rng', () => {
    const battle = setup(nine(), () => 0.5);
    expect(targetIds(battle, 'party-0', hit('x', 'random'))).toEqual(['enemy-4']);
  });

  it('HP selectors pick extremes, ties going front-most', () => {
    const battle = setup();
    battle.get('enemy-3').hp = 20;
    battle.get('enemy-5').hp = 20;
    battle.get('enemy-7').hp = 90;
    expect(targetIds(battle, 'party-0', hit('x', 'lowestHp'))).toEqual(['enemy-3']);
    expect(targetIds(battle, 'party-0', hit('x', 'lowestHpPct'))).toEqual(['enemy-3']);
    expect(targetIds(battle, 'party-0', hit('x', 'highestHp'))).toEqual(['enemy-0']);
  });

  it('distinguishes total HP from HP%', () => {
    const battle = setup(nine([{ hp: 300 }]));
    battle.get('enemy-0').hp = 150;
    expect(targetIds(battle, 'party-0', hit('x', 'highestHp'))).toEqual(['enemy-0']);
    expect(targetIds(battle, 'party-0', hit('x', 'highestHpPct'))).toEqual(['enemy-1']);
  });

  it('attackedMe targets the caster’s last attacker, else falls back to front', () => {
    const battle = setup();
    expect(targetIds(battle, 'party-1', hit('x', 'attackedMe'))).toEqual(['enemy-0']);
    battle.get('party-1').lastAttacker = 'enemy-6';
    expect(targetIds(battle, 'party-1', hit('x', 'attackedMe'))).toEqual(['enemy-6']);
    battle.get('enemy-6').hp = 0;
    expect(targetIds(battle, 'party-1', hit('x', 'attackedMe'))).toEqual(['enemy-0']);
  });

  it('mostDamage targets the top damage dealer', () => {
    const battle = setup();
    battle.get('enemy-4').damageDealt = 50;
    battle.get('enemy-2').damageDealt = 30;
    expect(targetIds(battle, 'party-0', hit('x', 'mostDamage'))).toEqual(['enemy-4']);
  });

  it('castSpell and castDefensive pick the front-most matching caster', () => {
    const battle = setup();
    expect(targetIds(battle, 'party-0', hit('x', 'castSpell'))).toEqual(['enemy-0']);
    battle.get('enemy-7').castSpell = true;
    battle.get('enemy-5').castSpell = true;
    battle.get('enemy-8').castDefensive = true;
    expect(targetIds(battle, 'party-0', hit('x', 'castSpell'))).toEqual(['enemy-5']);
    expect(targetIds(battle, 'party-0', hit('x', 'castDefensive'))).toEqual(['enemy-8']);
  });
});

describe('areas', () => {
  const setup = () =>
    new Battle(
      [member(unit('p0')), member(unit('p1')), member(unit('p2'))],
      Array.from({ length: 9 }, (_, i) => unit(`e${i}`)),
      NO_JITTER,
    );

  it('expands around the selected target on the enemy grid', () => {
    const battle = setup();
    battle.get('enemy-4').hp = 10;
    expect(targetIds(battle, 'party-0', hit('x', 'lowestHp', 'row'))).toEqual(['enemy-1', 'enemy-4', 'enemy-7']);
    expect(targetIds(battle, 'party-0', hit('x', 'lowestHp', 'column'))).toEqual(['enemy-3', 'enemy-4', 'enemy-5']);
    expect(targetIds(battle, 'party-0', hit('x', 'lowestHp', 'all'))).toHaveLength(9);
  });

  it('treats the party as one column of single-member rows', () => {
    const battle = setup();
    expect(targetIds(battle, 'enemy-0', hit('x', 'back', 'row'))).toEqual(['party-2']);
    expect(targetIds(battle, 'enemy-0', hit('x', 'back', 'column'))).toEqual(['party-0', 'party-1', 'party-2']);
  });

  it('skips dead units', () => {
    const battle = setup();
    battle.get('enemy-1').hp = 0;
    expect(targetIds(battle, 'party-0', hit('x', 'front', 'column'))).toEqual(['enemy-0', 'enemy-2']);
  });
});

describe('taunt', () => {
  const helm: EquipmentDef = { id: 'helm', name: 'helm', slot: 'helmet', rarity: 'epic', stats: {}, enchantment: { kind: 'taunt' } };
  const setup = () =>
    new Battle(
      [member(unit('p0')), member(unit('p1'), { helmet: helm }), member(unit('p2'))],
      [unit('e0')],
      NO_JITTER,
    );

  it('redirects every single-target attack to the taunter', () => {
    const battle = setup();
    expect(targetIds(battle, 'enemy-0', hit('x', 'front'))).toEqual(['party-1']);
    expect(targetIds(battle, 'enemy-0', hit('x', 'back'))).toEqual(['party-1']);
    expect(targetIds(battle, 'enemy-0', hit('x', 'random'))).toEqual(['party-1']);
  });

  it('does not redirect area attacks', () => {
    const battle = setup();
    expect(targetIds(battle, 'enemy-0', hit('x', 'back', 'row'))).toEqual(['party-2']);
  });

  it('stops once the taunter is dead', () => {
    const battle = setup();
    battle.get('party-1').hp = 0;
    expect(targetIds(battle, 'enemy-0', hit('x', 'front'))).toEqual(['party-0']);
  });
});

describe('effects', () => {
  it('barrier absorbs damage before HP', () => {
    const battle = new Battle(
      [member(unit('g', { defense: 20, hp: 1000 }, [guard]))],
      [unit('h', { attack: 30, hp: 1000 }, [hit('x', 'front', 'single', 1.5)])],
      NO_JITTER,
    );
    runFor(battle, 5.99);
    const hpBefore = battle.get('party-0').hp;
    const events = runFor(battle, 0.02).filter((e) => e.type === 'barrier' || e.type === 'damage');
    expect(events).toEqual([
      { type: 'barrier', target: 'party-0', amount: 20 },
      { type: 'damage', source: 'enemy-0', target: 'party-0', amount: 5, absorbed: 20 },
    ]);
    expect(battle.get('party-0').hp).toBe(hpBefore - 5);
  });

  it('heal restores HP from Magic Power, capped at max', () => {
    const heal: SkillDef = {
      id: 'heal',
      name: 'heal',
      category: 'spell',
      rarity: 'common',
      access: { kind: 'shared' },
      cooldown: 1,
      target: { side: 'ally', select: 'lowestHpPct', area: 'single' },
      effects: [{ kind: 'heal', scaling: 2 }],
    };
    const battle = new Battle([member(unit('c', { magic: 10 }, [heal])), member(unit('w'))], [unit('e')], NO_JITTER);
    battle.get('party-1').hp = 70;
    const events = runFor(battle, 1);
    expect(events).toContainEqual({ type: 'heal', source: 'party-0', target: 'party-1', amount: 20 });
    expect(battle.get('party-1').hp).toBe(90);
    runFor(battle, 1);
    expect(battle.get('party-1').hp).toBe(100);
  });

  it('buffs raise a stat, refresh instead of stacking, then expire', () => {
    const bless: SkillDef = {
      id: 'bless',
      name: 'bless',
      category: 'spell',
      rarity: 'common',
      access: { kind: 'shared' },
      cooldown: 2,
      target: { side: 'ally', select: 'front', area: 'all' },
      effects: [{ kind: 'buff', stat: 'defense', amount: 10, duration: 3 }],
    };
    const battle = new Battle([member(unit('c', {}, [bless])), member(unit('w'))], [unit('e')], NO_JITTER);
    runFor(battle, 2);
    expect(statOf(battle.get('party-1'), 'defense')).toBe(10);
    runFor(battle, 2);
    expect(battle.get('party-1').buffs).toHaveLength(1);
    battle.get('party-0').hp = 0;
    runFor(battle, 3);
    expect(statOf(battle.get('party-1'), 'defense')).toBe(0);
  });

  it('flags spell and defensive casters', () => {
    const zap: SkillDef = { ...hit('zap', 'front'), category: 'spell' };
    const shield: SkillDef = { ...guard, id: 'shield', category: 'spell', cooldown: 1 };
    const battle = new Battle([member(unit('a', {}, [zap])), member(unit('b', {}, [shield]))], [unit('e', { hp: 9999 })], NO_JITTER);
    runFor(battle, 1);
    expect([battle.get('party-0').castSpell, battle.get('party-0').castDefensive]).toEqual([true, false]);
    expect([battle.get('party-1').castSpell, battle.get('party-1').castDefensive]).toEqual([true, true]);
  });
});

describe('equipment', () => {
  const armor: EquipmentDef = { id: 'armor', name: 'armor', slot: 'armor', rarity: 'common', stats: { hp: 50, defense: 5 } };
  const ring: EquipmentDef = { id: 'ring', name: 'ring', slot: 'jewelry', rarity: 'common', stats: { attack: 5 } };

  it('adds item stats to max HP and derived stats', () => {
    const battle = new Battle([member(unit('a'), { armor, jewelry: ring })], [unit('e')], NO_JITTER);
    const a = battle.get('party-0');
    expect([a.maxHp, a.hp, statOf(a, 'defense'), statOf(a, 'attack')]).toEqual([150, 150, 5, 15]);
  });

  it('breaks exactly one worn item when a unit is KO’d, without touching the input', () => {
    const party = [member(unit('a', { hp: 10 }), { armor, jewelry: ring })];
    const battle = new Battle(party, [unit('e', { attack: 999 }, [hit('x', 'front')])], NO_JITTER);
    const events = runToEnd(battle);
    const broken = events.filter((e) => e.type === 'equipmentBroken');
    expect(broken).toEqual([{ type: 'equipmentBroken', target: 'party-0', slot: 'armor', item: 'armor' }]);
    expect(Object.keys(battle.get('party-0').equipment)).toEqual(['jewelry']);
    expect(Object.keys(party[0].equipment)).toEqual(['armor', 'jewelry']);
  });

  it('breaks nothing when no gear is worn', () => {
    const battle = new Battle([member(unit('a', { hp: 10 }))], [unit('e', { attack: 999 }, [hit('x', 'front')])], NO_JITTER);
    expect(runToEnd(battle).some((e) => e.type === 'equipmentBroken')).toBe(false);
  });
});

describe('outcome', () => {
  it('reports victory and stops acting', () => {
    const battle = new Battle([member(unit('a', { attack: 50 }, [slash]))], [unit('e', { hp: 30 })], NO_JITTER);
    const events = runToEnd(battle);
    expect(battle.result).toBe('victory');
    expect(events.at(-1)).toEqual({ type: 'end', result: 'victory' });
    expect(battle.tick(DT)).toEqual([]);
  });

  it('reports defeat when the whole party dies', () => {
    const battle = new Battle([member(unit('a', { hp: 10 }))], [unit('e', { attack: 999 }, [hit('x', 'front')])], NO_JITTER);
    runToEnd(battle);
    expect(battle.result).toBe('defeat');
  });

  it('the Phase 2 test encounter is winnable', () => {
    const results = Array.from({ length: 20 }, (_, seed) => {
      const battle = new Battle(testParty(), TEST_ENCOUNTER, seededRng(seed));
      runToEnd(battle);
      return battle.result;
    });
    expect(results.filter((r) => r === 'victory').length).toBeGreaterThanOrEqual(18);
  });
});
