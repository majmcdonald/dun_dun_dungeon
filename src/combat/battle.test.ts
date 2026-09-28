import { describe, expect, it } from 'vitest';
import { Battle, mitigate } from './battle';
import { SKILLS, SLIME, KNIGHT } from './data';
import type { BattleEvent, CombatantDef } from './types';

const DT = 1 / 60;
const NO_JITTER = () => 0;

function runFor(battle: Battle, seconds: number): BattleEvent[] {
  const events: BattleEvent[] = [];
  const ticks = Math.round(seconds / DT);
  for (let i = 0; i < ticks; i++) events.push(...battle.tick(DT));
  return events;
}

function runToEnd(battle: Battle, maxSeconds = 120): BattleEvent[] {
  const events: BattleEvent[] = [];
  while (!battle.result && battle.elapsed < maxSeconds) events.push(...battle.tick(DT));
  return events;
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

describe('Battle timers', () => {
  it('fires a skill exactly when its cooldown elapses', () => {
    const battle = new Battle([KNIGHT], [SLIME], NO_JITTER);
    const before = runFor(battle, 1.99);
    expect(before.some((e) => e.type === 'skill' && e.skill === 'slash')).toBe(false);
    const at = runFor(battle, 0.02);
    expect(at.some((e) => e.type === 'skill' && e.skill === 'slash')).toBe(true);
  });

  it('delays each first activation by less than 200ms', () => {
    const battle = new Battle([KNIGHT], [SLIME], () => 0.999);
    const before = runFor(battle, 2.0);
    expect(before.some((e) => e.type === 'skill' && e.skill === 'slash')).toBe(false);
    const within = runFor(battle, 0.2);
    expect(within.some((e) => e.type === 'skill' && e.skill === 'slash')).toBe(true);
  });

  it('runs slot timers independently and in parallel', () => {
    const battle = new Battle([KNIGHT], [{ ...SLIME, stats: { ...SLIME.stats, hp: 9999 } }], NO_JITTER);
    const events = runFor(battle, 12);
    const count = (id: string) => events.filter((e) => e.type === 'skill' && e.skill === id).length;
    expect(count('slash')).toBe(6);
    expect(count('shieldBash')).toBe(3);
    expect(count('ironGuard')).toBe(2);
  });
});

describe('Barrier', () => {
  const dummy: CombatantDef = {
    id: 'dummy',
    name: 'Dummy',
    stats: { hp: 1000, attack: 0, magic: 0, defense: 0, resistance: 0 },
    skills: [],
  };

  it('absorbs damage before HP', () => {
    const guard: CombatantDef = { ...dummy, stats: { ...dummy.stats, defense: 20 }, skills: [SKILLS.ironGuard] };
    const hitter: CombatantDef = { ...dummy, stats: { ...dummy.stats, attack: 30 }, skills: [SKILLS.bounce] };
    const battle = new Battle([guard], [hitter], NO_JITTER);
    runFor(battle, 5.99);
    const guardUnit = battle.get('party-0');
    const hpBefore = guardUnit.hp;
    // Barrier (party acts first) and the enemy hit both land at 6.0s.
    const events = runFor(battle, 0.02).filter((e) => e.type === 'barrier' || e.type === 'damage');
    expect(events).toEqual([
      { type: 'barrier', target: 'party-0', amount: 20 },
      { type: 'damage', source: 'enemy-0', target: 'party-0', amount: 5, absorbed: 20 },
    ]);
    expect(guardUnit.hp).toBe(hpBefore - 5);
    expect(guardUnit.barrier).toBeNull();
  });

  it('expires after its duration', () => {
    const guard: CombatantDef = { ...dummy, stats: { ...dummy.stats, defense: 20 }, skills: [SKILLS.ironGuard] };
    const battle = new Battle([guard], [dummy], NO_JITTER);
    runFor(battle, 6);
    expect(battle.get('party-0').barrier).not.toBeNull();
    runFor(battle, 4);
    expect(battle.get('party-0').barrier).toBeNull();
  });
});

describe('Battle outcome', () => {
  it('Knight defeats Slime in about 8 seconds', () => {
    const battle = new Battle([KNIGHT], [SLIME], NO_JITTER);
    const events = runToEnd(battle);
    expect(battle.result).toBe('victory');
    expect(battle.elapsed).toBeCloseTo(8, 1);
    expect(events.at(-1)).toEqual({ type: 'end', result: 'victory' });
  });

  it('reports defeat when the whole party dies', () => {
    const brute: CombatantDef = { ...SLIME, stats: { ...SLIME.stats, hp: 9999, attack: 200 } };
    const battle = new Battle([KNIGHT], [brute], NO_JITTER);
    runToEnd(battle);
    expect(battle.result).toBe('defeat');
  });

  it('stops acting after the battle ends', () => {
    const battle = new Battle([KNIGHT], [SLIME], NO_JITTER);
    runToEnd(battle);
    expect(battle.tick(DT)).toEqual([]);
  });
});
