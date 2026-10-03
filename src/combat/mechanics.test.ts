import { describe, expect, it } from 'vitest';
import { Battle, gridCell, MECHANIC, speedOf, statOf } from './battle';
import type { BattleEvent, CombatantDef, Condition, PartyMember, SkillDef, SkillEffect, Stats, Targeting, Trigger } from './types';

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
  return { id, name: id, category: 'skill', rarity: 'common', access: { kind: 'shared' }, cooldown: 1, target: FOE, effects, ...opts };
}

const hit = (scaling = 1): SkillEffect => ({ kind: 'damage', damageType: 'physical', stat: 'attack', scaling });
const fired = (events: BattleEvent[], id: string) => events.filter((e) => e.type === 'skill' && e.skill === id).length;
const damageTo = (events: BattleEvent[], target: string) =>
  events.filter((e): e is Extract<BattleEvent, { type: 'damage' }> => e.type === 'damage' && e.target === target);

const WOLF: CombatantDef = unit('wolf', {}, [skill('bite', [hit()])]);
const IMP: CombatantDef = unit('imp', {}, [skill('claw', [hit()])]);
const CREATURES = { wolf: WOLF, imp: IMP };

describe('timer speed', () => {
  it('slow and haste scale timers and refresh per source', () => {
    const slowIt = skill('slowIt', [{ kind: 'speed', factor: 0.5, duration: 100 }], { cooldown: 100 });
    const battle = new Battle([member(unit('a', {}, [slowIt]))], [unit('e', {}, [skill('poke', [hit(0)], { cooldown: 1 })])], NO_JITTER);
    runFor(battle, 100);
    expect(speedOf(battle.get('enemy-0'))).toBe(0.5);
    const events = runFor(battle, 10);
    expect(fired(events, 'poke')).toBe(5);
  });
});

describe('summons', () => {
  const call = skill('call', [{ kind: 'summon', creature: 'wolf', share: 0.5 }], { cooldown: 1, target: { side: 'self' } });

  it('stand in front of the party, scaled from the summoner, and draw front attacks', () => {
    const battle = new Battle(
      [member(unit('ranger', { hp: 200, attack: 20 }, [call]))],
      [unit('e', {}, [skill('poke', [hit()], { cooldown: 1.5 })])],
      NO_JITTER,
      { creatures: CREATURES },
    );
    const events = runFor(battle, 1.6);
    const wolf = battle.combatants.find((c) => c.summoner === 'party-0')!;
    expect([wolf.maxHp, wolf.def.stats.attack]).toEqual([100, 10]);
    expect(damageTo(events, wolf.uid).length).toBe(1);
    expect(damageTo(events, 'party-0').length).toBe(0);
  });

  it('are two per summoner, in front of them in the same row, with the newest replacing the oldest', () => {
    const battle = new Battle([member(unit('a')), member(unit('r', {}, [call]))], [unit('e')], NO_JITTER, { creatures: CREATURES });
    runFor(battle, 2.1);
    const cells = () => battle.alive('party').filter((c) => c.summoner).map((c) => [c.uid, gridCell(c)]);
    expect(cells()).toEqual([
      ['summon-1', { row: 1, column: 0 }],
      ['summon-2', { row: 1, column: 1 }],
    ]);
    runFor(battle, 1);
    expect(cells()).toEqual([
      ['summon-2', { row: 1, column: 1 }],
      ['summon-3', { row: 1, column: 0 }],
    ]);
    expect(gridCell(battle.get('party-1'))).toEqual({ row: 1, column: 2 });
  });

  it('never cause a defeat on their own', () => {
    const battle = new Battle([member(unit('r', { hp: 5 }, [call]))], [unit('e', { attack: 999 }, [skill('smash', [hit()], { cooldown: 3 })])], NO_JITTER, {
      creatures: CREATURES,
    });
    runFor(battle, 3.1);
    expect(battle.result).toBeNull();
  });
});

describe('familiar', () => {
  const warlock = unit('warlock', {}, [skill('bolt', [hit()], { cooldown: 1 })], { familiar: 'imp', mechanic: 'familiar' });

  it('channels 5s to summon at the start, pausing the warlock', () => {
    const battle = new Battle([member(warlock)], [unit('e')], NO_JITTER, { creatures: CREATURES });
    const early = runFor(battle, 4.9);
    expect(fired(early, 'bolt')).toBe(0);
    const later = runFor(battle, 1.2);
    expect(later.some((e) => e.type === 'summon')).toBe(true);
    expect(fired(later, 'bolt')).toBe(1);
  });

  it('resummons for 5s after the familiar dies', () => {
    const battle = new Battle([member(warlock)], [unit('e')], NO_JITTER, { creatures: CREATURES });
    runFor(battle, 5.1);
    const imp = battle.combatants.find((c) => c.familiar)!;
    imp.hp = 1;
    battle.get('enemy-0').slots.push({ def: skill('snipe', [hit()], { target: { side: 'enemy', select: 'front', area: 'single' } }), timer: 1 });
    runFor(battle, 0.1);
    expect(battle.get('party-0').channel).toBeGreaterThan(4);
  });
});

describe('meters', () => {
  it('rage fills from HP lost and triggers frenzy, doubling timer speed', () => {
    const barb = unit('barb', { hp: 100 }, [], { mechanic: 'rage' });
    const battle = new Battle([member(barb)], [unit('e', { attack: 60 }, [skill('hit', [hit()], { cooldown: 1 })])], NO_JITTER);
    const events = runFor(battle, 2);
    expect(events.some((e) => e.type === 'status' && e.status === 'frenzy')).toBe(true);
    expect(speedOf(battle.get('party-0'))).toBe(MECHANIC.frenzySpeed);
  });

  it('storm skills wait for frenzy, then fire', () => {
    const storm = skill('storm', [hit()], { cooldown: 1, condition: { kind: 'frenzy' } });
    const barb = unit('barb', { hp: 100 }, [storm], { mechanic: 'rage' });
    const battle = new Battle([member(barb)], [unit('e', { attack: 0 })], NO_JITTER);
    expect(fired(runFor(battle, 3), 'storm')).toBe(0);
    battle.get('party-0').burst = 5;
    expect(fired(runFor(battle, 0.1), 'storm')).toBe(1);
  });

  it('chi reduces damage while filling, then bursts', () => {
    const jab = skill('jab', [hit(1)], { cooldown: 1 });
    const monk = unit('monk', { attack: 100 }, [jab], { mechanic: 'chi' });
    const battle = new Battle([member(monk)], [unit('e', { hp: 100000 })], NO_JITTER);
    const first = damageTo(runFor(battle, 1), 'enemy-0')[0].amount;
    expect(first).toBe(80);
    const later = runFor(battle, 10);
    expect(later.some((e) => e.type === 'status' && e.status === 'burst')).toBe(true);
    expect(Math.max(...damageTo(later, 'enemy-0').map((d) => d.amount))).toBe(180);
  });

  it('souls fill on any death and are spent by soul spells', () => {
    const reap = skill('reap', [hit()], { cooldown: 1, condition: { kind: 'souls', cost: 2 } });
    const necro = unit('necro', { attack: 999 }, [skill('kill', [hit()], { cooldown: 1 }), reap], { mechanic: 'souls' });
    const battle = new Battle([member(necro)], [unit('a', { hp: 1 }), unit('b', { hp: 1 }), unit('c')], NO_JITTER);
    const events = runFor(battle, 2.1);
    expect(fired(events, 'reap')).toBe(1);
    expect(battle.get('party-0').meter).toBe(0);
  });
});

describe('event skills', () => {
  const honor = (trigger: Trigger) => skill('honor', [hit()], { cooldown: 3, trigger });

  it('whenHit timers only fill when the owner is hit', () => {
    const knight = unit('knight', {}, [honor({ kind: 'whenHit', perEvent: 1 })]);
    const quiet = new Battle([member(knight)], [unit('e', { attack: 0 })], NO_JITTER);
    expect(fired(runFor(quiet, 10), 'honor')).toBe(0);
    const busy = new Battle([member(knight)], [unit('e', {}, [skill('poke', [hit()], { cooldown: 1 })])], NO_JITTER);
    expect(fired(runFor(busy, 3.1), 'honor')).toBe(1);
  });

  it('allyHurt timers fill when another party member is hurt', () => {
    const paladin = unit('pal', {}, [honor({ kind: 'allyHurt', perEvent: 1 })]);
    const battle = new Battle([member(unit('front')), member(paladin)], [unit('e', {}, [skill('poke', [hit()], { cooldown: 1 })])], NO_JITTER);
    expect(fired(runFor(battle, 3.1), 'honor')).toBe(1);
  });

  it('partyLow timers only run while the party is below the threshold', () => {
    const cleric = unit('cleric', {}, [honor({ kind: 'partyLow', threshold: 0.35 })]);
    const battle = new Battle([member(cleric)], [unit('e', { attack: 0 })], NO_JITTER);
    expect(fired(runFor(battle, 5), 'honor')).toBe(0);
    battle.get('party-0').hp = 300;
    expect(fired(runFor(battle, 3.1), 'honor')).toBe(1);
  });

  it('onDefeat skills fire once when the owner falls', () => {
    const lastWord = skill('lastWord', [{ kind: 'barrier', stat: 'defense', scaling: 1, duration: 5 }], {
      trigger: { kind: 'onDefeat' },
      target: { side: 'ally', select: 'front', area: 'all' },
    });
    const knight = unit('knight', { hp: 5, defense: 50 }, [lastWord]);
    const battle = new Battle([member(knight), member(unit('friend'))], [unit('e', {}, [skill('poke', [hit()], { cooldown: 1 })])], NO_JITTER);
    const events = runFor(battle, 1.1);
    expect(fired(events, 'lastWord')).toBe(1);
    expect(battle.get('party-1').barrier?.amount).toBe(50);
  });
});

describe('conditions', () => {
  const open = skill('open', [hit()], { cooldown: 1, condition: { kind: 'onlyJewelry' } as Condition });

  it('open hand works bare-handed, holds when armed', () => {
    const ring = { id: 'ring', name: 'ring', slot: 'jewelry' as const, rarity: 'common' as const, stats: {} };
    const sword = { id: 'sword', name: 'sword', slot: 'weapon' as const, rarity: 'common' as const, stats: {} };
    const bare = new Battle([member(unit('m', {}, [open]), { jewelry: ring })], [unit('e')], NO_JITTER);
    expect(fired(runFor(bare, 1.1), 'open')).toBe(1);
    const armed = new Battle([member(unit('m', {}, [open]), { weapon: sword })], [unit('e')], NO_JITTER);
    expect(fired(runFor(armed, 3), 'open')).toBe(0);
  });
});

describe('control effects', () => {
  it('transformed enemies stop acting and take 25% more damage', () => {
    const polymorph = skill('poly', [{ kind: 'transform', duration: 5 }], { cooldown: 100 });
    const battle = new Battle(
      [member(unit('m', {}, [polymorph, skill('zap', [hit(10)], { cooldown: 101 })]))],
      [unit('e', {}, [skill('poke', [hit()], { cooldown: 1 })])],
      NO_JITTER,
    );
    const events = runFor(battle, 101.1);
    expect(fired(events, 'poke')).toBeGreaterThan(90);
    const b2 = new Battle([member(unit('m', {}, [polymorph]))], [unit('e', {}, [skill('poke', [hit()], { cooldown: 1 })])], NO_JITTER);
    runFor(b2, 100);
    expect(fired(runFor(b2, 4), 'poke')).toBe(0);
  });

  it('delay pushes enemy timers back', () => {
    const scare = skill('scare', [{ kind: 'delay', seconds: 2 }], { cooldown: 0.5 });
    const battle = new Battle([member(unit('n', {}, [scare]))], [unit('e', {}, [skill('poke', [hit()], { cooldown: 1 })])], NO_JITTER);
    expect(fired(runFor(battle, 5), 'poke')).toBe(0);
  });

  it('skill taunt draws single-target attacks for its duration', () => {
    const shout = skill('shout', [{ kind: 'taunt', duration: 10 }], { target: { side: 'self' } });
    const battle = new Battle(
      [member(unit('a')), member(unit('b', {}, [shout]))],
      [unit('e', {}, [skill('poke', [hit()], { cooldown: 1.5 })])],
      NO_JITTER,
    );
    const events = runFor(battle, 1.6);
    expect(damageTo(events, 'party-1')).toHaveLength(1);
  });

  it('shapeshift pauses non-form skills and boosts form skills', () => {
    const bear = skill('bear', [{ kind: 'shapeshift', duration: 5, bonus: 1 }], { cooldown: 100, target: { side: 'self' } });
    const maul = skill('maul', [hit(1)], { cooldown: 1, form: true });
    const spell = skill('spell', [hit(1)], { cooldown: 1 });
    const druid = unit('d', { attack: 50 }, [maul, spell, bear]);
    const battle = new Battle([member(druid)], [unit('e', { hp: 100000 })], NO_JITTER);
    runFor(battle, 100);
    const events = runFor(battle, 3);
    expect(fired(events, 'spell')).toBe(0);
    expect(damageTo(events, 'enemy-0')[0].amount).toBe(100);
  });
});

describe('thief and misc effects', () => {
  it('steal takes a buff, siphon moves a stat, gold accrues', () => {
    const rally = skill('rally', [{ kind: 'buff', stat: 'attack', amount: 20, duration: 50 }], { target: { side: 'self' }, cooldown: 1 });
    const filch = skill('filch', [{ kind: 'steal' }, { kind: 'siphon', stat: 'defense', amount: 5, duration: 10 }, { kind: 'gold', amount: 7 }], {
      cooldown: 2,
    });
    const battle = new Battle([member(unit('rogue', {}, [filch]))], [unit('e', { defense: 10 }, [rally])], NO_JITTER);
    runFor(battle, 2.01);
    expect(statOf(battle.get('party-0'), 'attack')).toBe(30);
    expect(statOf(battle.get('party-0'), 'defense')).toBe(5);
    expect(statOf(battle.get('enemy-0'), 'defense')).toBe(5);
    expect(battle.gold).toBe(7);
  });

  it('self-damage never kills, and builds rage (bleeding alone tops out at 99)', () => {
    const bleed = skill('bleed', [{ kind: 'selfDamage', fraction: 0.6, self: true }], { cooldown: 1, target: { side: 'self' } });
    const barb = unit('barb', { hp: 100 }, [bleed], { mechanic: 'rage' });
    const battle = new Battle([member(barb)], [unit('e')], NO_JITTER);
    runFor(battle, 3);
    expect(battle.get('party-0').hp).toBe(1);
    expect(battle.get('party-0').meter).toBeCloseTo(99, 5);
  });

  it('zealot damage favors spellcasters', () => {
    const zeal = skill('zeal', [{ kind: 'damage', damageType: 'physical', stat: 'attack', scaling: 1, vsCasters: { bonus: 0.5, penalty: 0.3 } }], { cooldown: 1 });
    const battle = new Battle([member(unit('z', { attack: 100 }, [zeal]))], [unit('e', { hp: 100000 })], NO_JITTER);
    expect(damageTo(runFor(battle, 1), 'enemy-0')[0].amount).toBe(70);
    battle.get('enemy-0').castSpell = true;
    expect(damageTo(runFor(battle, 1), 'enemy-0')[0].amount).toBe(150);
  });

  it('glory grows with fight length', () => {
    const glory = skill('glory', [hit(1)], { cooldown: 10, glory: 0.05 });
    const battle = new Battle([member(unit('p', { attack: 100 }, [glory]))], [unit('e', { hp: 100000 })], NO_JITTER);
    const amounts = damageTo(runFor(battle, 20), 'enemy-0').map((d) => d.amount);
    expect(amounts).toEqual([110, 120]);
  });

  it('sacrificing a summon kills it and triggers a familiar resummon', () => {
    const offer = skill('offer', [{ kind: 'consumeSummon', self: true }, { kind: 'buff', stat: 'magic', amount: 10, duration: 5, self: true }], {
      cooldown: 7,
      target: { side: 'self' },
    });
    const warlock = unit('w', {}, [offer], { familiar: 'imp', mechanic: 'familiar' });
    const battle = new Battle([member(warlock)], [unit('e', { attack: 0 })], NO_JITTER, { creatures: CREATURES });
    runFor(battle, 12.1);
    expect(battle.combatants.find((c) => c.familiar)!.hp).toBe(0);
    expect(battle.get('party-0').channel).toBeGreaterThan(0);
    expect(statOf(battle.get('party-0'), 'magic')).toBe(20);
  });

  it('chaos picks one of its options', () => {
    const wild = skill('wild', [{ kind: 'chaos', options: [hit(1), { kind: 'gold', amount: 5 }] }], { cooldown: 1 });
    const battle = new Battle([member(unit('m', {}, [wild]))], [unit('e')], () => 0.99);
    runFor(battle, 1.25);
    expect(battle.gold).toBe(5);
  });
});

describe('enemy grid', () => {
  it('keeps empty cells empty, so enemies stand where they were placed', () => {
    const battle = new Battle([member(unit('a'))], [null, null, null, unit('mid'), null, null, null, null, unit('back')], NO_JITTER);
    const enemies = battle.combatants.filter((c) => c.side === 'enemy');
    expect(enemies.map((c) => [c.def.id, gridCell(c)])).toEqual([
      ['mid', { row: 0, column: 1 }],
      ['back', { row: 2, column: 2 }],
    ]);
  });
});

describe('boss mechanics', () => {
  const minion = unit('minion', { hp: 50 }, [skill('poke', [hit(0)], { cooldown: 99 })]);
  const call = (count: number, cap: number) =>
    skill('call', [{ kind: 'spawn', enemy: 'minion', count, cap }], { cooldown: 1, target: { side: 'self' } });

  it('spawn reinforcements into empty cells front to back, never above the cap', () => {
    const boss = unit('boss', {}, [call(2, 3)]);
    const battle = new Battle([member(unit('a', { attack: 0 }))], [null, null, null, null, boss], NO_JITTER, { bestiary: { minion } });
    const events = runFor(battle, 1.05);
    expect(events.filter((e) => e.type === 'summon')).toHaveLength(2);
    runFor(battle, 2);
    const minions = battle.alive('enemy').filter((c) => c.def.id === 'minion');
    expect(minions.map((c) => c.position)).toEqual([0, 1, 2]);
  });

  it('fire a below-HP ability once when crossing the threshold', () => {
    const rage = skill('rage', [{ kind: 'buff', stat: 'attack', amount: 5, duration: 99 }], {
      cooldown: 1,
      target: { side: 'self' },
      trigger: { kind: 'belowHp', threshold: 0.5 },
    });
    const boss = unit('boss', { hp: 100, defense: 0 }, [rage]);
    const battle = new Battle([member(unit('a', { attack: 30 }, [skill('hit', [hit()], { cooldown: 1 })]))], [boss], NO_JITTER);
    const early = runFor(battle, 1.05);
    expect(fired(early, 'rage')).toBe(0);
    const later = runFor(battle, 1);
    expect(fired(later, 'rage')).toBe(1);
    expect(fired(runFor(battle, 0.9), 'rage')).toBe(0);
  });

  it('regenerate a share of max HP per second, paused by the blocking element', () => {
    const troll = unit('troll', { hp: 100 }, [], { regeneration: { perSecond: 0.1, blockedBy: ['fire'], blockSeconds: 2 } });
    const battle = new Battle([member(unit('a'))], [troll], NO_JITTER);
    const t = battle.get('enemy-0');
    t.hp = 50;
    runFor(battle, 1);
    expect(t.hp).toBeGreaterThanOrEqual(59);
    expect(t.hp).toBeLessThanOrEqual(60);
    const burn = skill('burn', [{ kind: 'damage', damageType: 'magic', stat: 'magic', scaling: 0, element: 'fire' }], { cooldown: 99 });
    battle.get('party-0').slots.push({ def: burn, timer: 99 });
    runFor(battle, 1.5);
    expect(t.hp).toBeLessThanOrEqual(60);
    runFor(battle, 2);
    expect(t.hp).toBeGreaterThan(60);
  });
});

describe('dying bosses', () => {
  it('can spawn minions as they fall, and the fight goes on', () => {
    const minion = unit('minion', { hp: 50 }, []);
    const burst = skill('burst', [{ kind: 'spawn', enemy: 'minion', count: 3, cap: 9 }], {
      cooldown: 1,
      target: { side: 'self' },
      trigger: { kind: 'onDefeat' },
    });
    const boss = unit('boss', { hp: 10, defense: 0 }, [burst]);
    const battle = new Battle([member(unit('a', { attack: 50 }, [skill('hit', [hit()], { cooldown: 1 })]))], [boss], NO_JITTER, {
      bestiary: { minion },
    });
    runFor(battle, 1.05);
    expect(battle.alive('enemy').map((c) => c.def.id)).toEqual(['minion', 'minion', 'minion']);
    expect(battle.result).toBeNull();
  });
});
