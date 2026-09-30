import { describe, expect, it } from 'vitest';
import { Battle, statOf } from './battle';
import type { BattleEvent, CombatantDef, EquipmentDef, PartyMember, SkillDef, SkillEffect, Stats, Targeting } from './types';

const DT = 1 / 60;
const NO_JITTER = () => 0;

function runFor(battle: Battle, seconds: number): BattleEvent[] {
  const events: BattleEvent[] = [];
  const ticks = Math.round(seconds / DT);
  for (let i = 0; i < ticks; i++) events.push(...battle.tick(DT));
  return events;
}

const BASE: Stats = { hp: 1000, attack: 10, magic: 10, defense: 0, resistance: 0 };

function unit(id: string, stats: Partial<Stats> = {}, skills: SkillDef[] = [], extra: Partial<CombatantDef> = {}): CombatantDef {
  return { id, name: id, stats: { ...BASE, ...stats }, skills, ...extra };
}

function member(def: CombatantDef, equipment: PartyMember['equipment'] = {}): PartyMember {
  return { def, equipment, skills: def.skills };
}

const FOE: Targeting = { side: 'enemy', select: 'front', area: 'single' };

function skill(id: string, effects: SkillEffect[], opts: Partial<SkillDef> = {}): SkillDef {
  return {
    id,
    name: id,
    category: 'skill',
    rarity: 'common',
    access: { kind: 'shared' },
    cooldown: 1,
    target: FOE,
    effects,
    ...opts,
  };
}

const physical = (scaling = 1, extra: object = {}): SkillEffect => ({
  kind: 'damage',
  damageType: 'physical',
  stat: 'attack',
  scaling,
  ...extra,
});

function item(id: string, enchantment: EquipmentDef['enchantment'], stats: EquipmentDef['stats'] = {}): EquipmentDef {
  return { id, name: id, slot: 'jewelry', rarity: 'epic', stats, enchantment };
}

const damageTo = (events: BattleEvent[], target: string) =>
  events.filter((e): e is Extract<BattleEvent, { type: 'damage' }> => e.type === 'damage' && e.target === target);

describe('elements', () => {
  const fire = skill('fire', [physical(10, { element: 'fire' })]);

  it('innate resistance and weakness scale elemental damage after mitigation', () => {
    const battle = new Battle(
      [member(unit('a', {}, [fire]))],
      [unit('resists', {}, [], { resist: { fire: 0.5 } })],
      NO_JITTER,
    );
    expect(damageTo(runFor(battle, 1), 'enemy-0')[0].amount).toBe(50);

    const weak = new Battle([member(unit('a', {}, [fire]))], [unit('weak', {}, [], { resist: { fire: -0.5 } })], NO_JITTER);
    expect(damageTo(runFor(weak, 1), 'enemy-0')[0].amount).toBe(150);
  });

  it('gear resist enchantments stack with innate resist', () => {
    const cloak = item('cloak', { kind: 'resist', element: 'fire', amount: 0.3 });
    const battle = new Battle([member(unit('p'), { jewelry: cloak })], [unit('e', {}, [fire])], NO_JITTER);
    expect(damageTo(runFor(battle, 1), 'party-0')[0].amount).toBe(70);
  });

  it('non-elemental damage ignores elemental resist', () => {
    const battle = new Battle(
      [member(unit('a', {}, [skill('plain', [physical(10)])]))],
      [unit('e', {}, [], { resist: { fire: 0.9 } })],
      NO_JITTER,
    );
    expect(damageTo(runFor(battle, 1), 'enemy-0')[0].amount).toBe(100);
  });
});

describe('multi-hit and drain', () => {
  it('multi-hit lands separate hits', () => {
    const battle = new Battle([member(unit('a', {}, [skill('flurry', [physical(1, { hits: 3 })])]))], [unit('e')], NO_JITTER);
    expect(damageTo(runFor(battle, 1), 'enemy-0').map((e) => e.amount)).toEqual([10, 10, 10]);
  });

  it('drain heals the caster for a share of damage landed', () => {
    const battle = new Battle([member(unit('a', {}, [skill('leech', [physical(10, { drain: 0.5 })])]))], [unit('e')], NO_JITTER);
    battle.get('party-0').hp = 500;
    runFor(battle, 1);
    expect(battle.get('party-0').hp).toBe(550);
  });
});

describe('periodic effects', () => {
  it('damage over time ticks once per second for its duration, honoring resist', () => {
    const poison = skill('poison', [{ kind: 'dot', stat: 'attack', scaling: 1, duration: 3, element: 'poison' }], { cooldown: 100 });
    const battle = new Battle(
      [member(unit('a', {}, [poison]))],
      [unit('e', {}, [], { resist: { poison: 0.5 } })],
      NO_JITTER,
    );
    const events = runFor(battle, 104);
    const ticks = damageTo(events, 'enemy-0').filter((e) => e.periodic);
    expect(ticks.map((e) => e.amount)).toEqual([5, 5, 5]);
  });

  it('reapplying a damage over time refreshes rather than stacks', () => {
    const poison = skill('poison', [{ kind: 'dot', stat: 'attack', scaling: 1, duration: 5 }], { cooldown: 1 });
    const battle = new Battle([member(unit('a', {}, [poison]))], [unit('e')], NO_JITTER);
    runFor(battle, 3);
    expect(battle.get('enemy-0').dots).toHaveLength(1);
  });

  it('keeps ticking when reapplied every second, and can end the battle', () => {
    const poison = skill('poison', [{ kind: 'dot', stat: 'attack', scaling: 1, duration: 10 }], { cooldown: 1 });
    const battle = new Battle([member(unit('a', {}, [poison]))], [unit('e', { hp: 25 })], NO_JITTER);
    runFor(battle, 5);
    expect(battle.result).toBe('victory');
  });

  it('regen heals every second from the caster’s Magic Power', () => {
    const grow = skill('grow', [{ kind: 'regen', scaling: 0.5, duration: 4 }], {
      cooldown: 100,
      category: 'spell',
      target: { side: 'ally', select: 'lowestHpPct', area: 'single' },
    });
    const battle = new Battle([member(unit('d', { magic: 20 }, [grow])), member(unit('w'))], [unit('e')], NO_JITTER);
    battle.get('party-1').hp = 900;
    const events = runFor(battle, 105);
    const heals = events.filter((e) => e.type === 'heal' && e.periodic);
    expect(heals).toHaveLength(4);
    expect(battle.get('party-1').hp).toBe(940);
    expect(battle.get('party-0').castDefensive).toBe(true);
  });
});

describe('debuffs', () => {
  it('lower a stat, refresh per source, and expire', () => {
    const curse = skill('curse', [{ kind: 'debuff', stat: 'defense', amount: 10, duration: 2 }], { cooldown: 1 });
    const battle = new Battle([member(unit('a', {}, [curse]))], [unit('e', { defense: 30 })], NO_JITTER);
    runFor(battle, 3);
    const e = battle.get('enemy-0');
    expect(e.buffs).toHaveLength(1);
    expect(statOf(e, 'defense')).toBe(20);
  });

  it('a skill can change two stats without overwriting itself', () => {
    const curse = skill('curse', [
      { kind: 'debuff', stat: 'defense', amount: 5, duration: 5 },
      { kind: 'debuff', stat: 'resistance', amount: 5, duration: 5 },
    ]);
    const battle = new Battle([member(unit('a', {}, [curse]))], [unit('e', { defense: 10, resistance: 10 })], NO_JITTER);
    runFor(battle, 1);
    const e = battle.get('enemy-0');
    expect([statOf(e, 'defense'), statOf(e, 'resistance')]).toEqual([5, 5]);
  });

  it('never push a stat below zero', () => {
    const curse = skill('curse', [{ kind: 'debuff', stat: 'defense', amount: 50, duration: 5 }]);
    const battle = new Battle([member(unit('a', {}, [curse]))], [unit('e', { defense: 10 })], NO_JITTER);
    runFor(battle, 1);
    expect(statOf(battle.get('enemy-0'), 'defense')).toBe(0);
  });
});

describe('synergy', () => {
  const strike = skill('strike', [physical(1)], { synergy: { with: 'focus', bonus: 0.5 } });
  const focus = skill('focus', [{ kind: 'buff', stat: 'magic', amount: 1, duration: 1 }], { cooldown: 100, target: { side: 'self' } });

  it('boosts the skill when its partner is equipped on the same character', () => {
    const withPartner = new Battle([member(unit('a', {}, [strike, focus]))], [unit('e')], NO_JITTER);
    expect(damageTo(runFor(withPartner, 1), 'enemy-0')[0].amount).toBe(15);
    const alone = new Battle([member(unit('a', {}, [strike]))], [unit('e')], NO_JITTER);
    expect(damageTo(runFor(alone, 1), 'enemy-0')[0].amount).toBe(10);
  });
});

describe('enchantments', () => {
  const hit = skill('hit', [physical(5)]);

  it('on-hit applies its effect to the struck target', () => {
    const brand = item('brand', { kind: 'onHit', chance: 1, effect: { kind: 'debuff', stat: 'defense', amount: 5, duration: 5 } });
    const battle = new Battle([member(unit('a', {}, [hit]), { jewelry: brand })], [unit('e', { defense: 20 })], NO_JITTER);
    runFor(battle, 1);
    expect(statOf(battle.get('enemy-0'), 'defense')).toBe(15);
  });

  it('on-hit effects do not chain off their own damage', () => {
    const spark = item('spark', { kind: 'onHit', chance: 1, effect: physical(1) });
    const battle = new Battle([member(unit('a', {}, [hit]), { jewelry: spark })], [unit('e')], NO_JITTER);
    expect(damageTo(runFor(battle, 1), 'enemy-0')).toHaveLength(2);
  });

  it('thorns reflect a share of damage to the attacker', () => {
    const spikes = item('spikes', { kind: 'thorns', fraction: 0.5 });
    const battle = new Battle([member(unit('p'), { jewelry: spikes })], [unit('e', {}, [hit])], NO_JITTER);
    const events = runFor(battle, 1);
    expect(damageTo(events, 'enemy-0')[0].amount).toBe(25);
  });

  it('when-hit effects go to the wearer if helpful, the attacker if hostile', () => {
    const ward = item('ward', { kind: 'onHitTaken', chance: 1, effect: { kind: 'barrier', stat: 'defense', scaling: 1, duration: 5 } });
    const hex = item('hex', { kind: 'onHitTaken', chance: 1, effect: { kind: 'debuff', stat: 'attack', amount: 3, duration: 5 } });
    const battle = new Battle(
      [member(unit('p', { defense: 40 }), { jewelry: ward }), member(unit('q'), { jewelry: hex })],
      [unit('e', {}, [hit])],
      NO_JITTER,
    );
    runFor(battle, 1);
    expect(battle.get('party-0').barrier?.amount).toBe(40);

    const second = new Battle([member(unit('q'), { jewelry: hex })], [unit('e', {}, [hit])], NO_JITTER);
    runFor(second, 1);
    expect(statOf(second.get('enemy-0'), 'attack')).toBe(7);
  });

  it('ally-death effects fire for surviving allies', () => {
    const vow = item('vow', { kind: 'onAllyDeath', effect: { kind: 'buff', stat: 'attack', amount: 20, duration: 10 } });
    const battle = new Battle(
      [member(unit('fragile', { hp: 5 })), member(unit('avenger'), { jewelry: vow })],
      [unit('e', {}, [hit])],
      NO_JITTER,
    );
    runFor(battle, 1);
    expect(statOf(battle.get('party-1'), 'attack')).toBe(30);
  });
});
