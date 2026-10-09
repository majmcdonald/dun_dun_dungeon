// Plays whole runs headlessly with a simple greedy player, to compare reward/balance changes.
// Skipped by `npm test`; run with `npm run simulate` (RUNS=300 by default, PICKS=both for the old 1 skill + 1 item rule).
import { describe, it } from 'vitest';
import { Battle } from '../src/combat/battle';
import { RARITIES, type CombatantDef, type EquipmentDef, type PartyMember, type SkillDef } from '../src/combat/types';
import { CLASSES, type ClassDef } from '../src/content/classes';
import { CREATURES } from '../src/content/creatures';
import { ENEMIES, ENEMIES_BY_ID, MAP_ENCOUNTER } from '../src/content/enemies';
import { EVENT_LIBRARY } from '../src/content/events';
import { ITEM_LIBRARY, ITEMS_BY_ID } from '../src/content/items';
import { SKILL_LIBRARY, SKILLS_BY_ID } from '../src/content/skills';
import { seededRng, type Rng } from '../src/engine/random';
import { equipItemBlock, equippedSkills, placeSkillBlock, skillAccessBlock, TIMED_SLOTS, TRIGGER_SLOT } from '../src/game/loadout';
import { createState, type GameState } from '../src/game/state';
import { encounterEnemies, pickEncounter } from '../src/run/encounters';
import { canAfford, chooseOption, openEvent, takeNextFight } from '../src/run/events';
import type { MapNode, NodeType } from '../src/run/map';
import { rollReward } from '../src/run/rewards';
import { beginNode, clearNode, itemRef, nextNodes, recordWin, roomType, setRewardPicks, startRun } from '../src/run/run';
import { brokenItems, buy, itemPrice, openStore, repair, repairPrice, sell, skillPrice } from '../src/run/store';

const RUNS = Number(process.env.RUNS ?? 300);
const BOTH_PICKS = process.env.PICKS === 'both';
const DT = 1 / 30;
const MAX_FIGHT_SECONDS = 600;
const FRONT_FIRST = ['tank', 'bruiser', 'striker', 'support', 'caster'];

const rank = (r: { rarity: string }) => RARITIES.indexOf(r.rarity as (typeof RARITIES)[number]);

interface Outcome {
  won: boolean;
  act: number;
  diedTo: NodeType | null;
  party: string[];
  // Every fight played, as "act:encounter" keys; the last one is the loss on a lost run.
  fought: string[];
  fights: number;
  gear: number[];
}

// How much a member gets from an item: their main damage stat, both defenses, a quarter of HP, and a bit for enchantments.
function itemScore(member: PartyMember, item: EquipmentDef | undefined): number {
  if (!item) return 0;
  const s = item.stats;
  const main = member.def.stats.magic > member.def.stats.attack ? (s.magic ?? 0) : (s.attack ?? 0);
  return main + (s.defense ?? 0) + (s.resistance ?? 0) + (s.hp ?? 0) / 4 + (item.enchantment ? 4 : 0);
}

function bestItemGain(state: GameState, item: EquipmentDef): { member: PartyMember; gain: number } | null {
  let best: { member: PartyMember; gain: number } | null = null;
  for (const m of state.party) {
    if (equipItemBlock(m, item)) continue;
    const gain = itemScore(m, item) - itemScore(m, m.equipment[item.slot]);
    if (gain > 0 && (!best || gain > best.gain)) best = { member: m, gain };
  }
  return best;
}

// Where a skill would go: an empty slot first, else over the lowest-rarity skill it beats.
function skillSpot(state: GameState, skill: SkillDef): { member: PartyMember; slot: number; gain: number } | null {
  let best: { member: PartyMember; slot: number; gain: number } | null = null;
  for (const m of state.party) {
    if (skillAccessBlock(m, skill) || equippedSkills(m).some((s) => s.id === skill.id)) continue;
    const slots = skill.trigger ? [TRIGGER_SLOT] : [...Array(Math.min(m.skills.length + 1, TIMED_SLOTS)).keys()];
    for (const slot of slots) {
      const current = slot === TRIGGER_SLOT ? m.trigger : m.skills[slot];
      const gain = current ? rank(skill) - rank(current) : 10 + rank(skill);
      if (gain <= 0 || placeSkillBlock(m, skill, slot)) continue;
      if (!best || gain > best.gain) best = { member: m, slot, gain };
    }
  }
  return best;
}

function replaceMember(state: GameState, old: PartyMember, next: PartyMember): void {
  state.party = state.party.map((m) => (m === old ? next : m));
}

// Equips anything in the inventory that is an upgrade for someone; replaced pieces go back to the inventory.
function autoEquip(state: GameState): void {
  for (let changed = true; changed; ) {
    changed = false;
    for (const item of [...state.inventory.items]) {
      const spot = bestItemGain(state, item);
      if (!spot) continue;
      const old = spot.member.equipment[item.slot];
      state.inventory.items.splice(state.inventory.items.indexOf(item), 1);
      if (old) state.inventory.items.push(old);
      replaceMember(state, spot.member, { ...spot.member, equipment: { ...spot.member.equipment, [item.slot]: item } });
      changed = true;
    }
    for (const skill of [...state.inventory.skills]) {
      const spot = skillSpot(state, skill);
      if (!spot) continue;
      const m = spot.member;
      state.inventory.skills.splice(state.inventory.skills.indexOf(skill), 1);
      if (spot.slot === TRIGGER_SLOT) {
        if (m.trigger) state.inventory.skills.push(m.trigger);
        replaceMember(state, m, { ...m, trigger: skill });
      } else {
        const skills = [...m.skills];
        if (skills[spot.slot]) state.inventory.skills.push(skills[spot.slot]);
        skills[spot.slot] = skill;
        replaceMember(state, m, { ...m, skills });
      }
      changed = true;
    }
  }
}

function cardValue(state: GameState, card: SkillDef | EquipmentDef): number {
  const useful = 'slot' in card ? !!bestItemGain(state, card) : !!skillSpot(state, card);
  return useful ? 1 + rank(card) : -1;
}

function takeReward(state: GameState, rng: Rng): void {
  const reward = state.run!.lastReward;
  if (!reward) return;
  const skills = reward.skills.map((id) => SKILLS_BY_ID[id]);
  const items = reward.items.map((id) => ITEMS_BY_ID[id]);
  const best = <T extends SkillDef | EquipmentDef>(cards: T[]): T | null => {
    const scored = cards.map((c) => ({ c, v: cardValue(state, c) + rng() * 0.1 })).filter((x) => x.v > 0);
    return scored.sort((a, b) => b.v - a.v)[0]?.c ?? null;
  };
  let skill = best(skills);
  let item = best(items);
  if (!BOTH_PICKS && skill && item) {
    if (cardValue(state, skill) >= cardValue(state, item)) item = null;
    else skill = null;
  }
  setRewardPicks(state, skill?.id ?? null, item?.id ?? null);
  autoEquip(state);
}

// Repairs first, sells spare gear, then buys whatever is an upgrade, best rarity first.
function shop(state: GameState): void {
  const run = state.run!;
  const broken = brokenItems(state);
  const fix = broken.findIndex((i) => !!bestItemGain(state, i));
  if (fix >= 0 && run.gold >= repairPrice(broken[fix])) repair(state, fix);
  autoEquip(state);
  for (const item of [...state.inventory.items]) sell(state, item);
  const stock = [
    ...run.store!.items.map((id) => ({ kind: 'item' as const, def: ITEMS_BY_ID[id] as SkillDef | EquipmentDef, price: itemPrice(ITEMS_BY_ID[id]) })),
    ...run.store!.skills.map((id) => ({ kind: 'skill' as const, def: SKILLS_BY_ID[id] as SkillDef | EquipmentDef, price: skillPrice(SKILLS_BY_ID[id]) })),
  ].sort((a, b) => rank(b.def) - rank(a.def));
  for (const s of stock) {
    if (run.gold < s.price || cardValue(state, s.def) <= 0) continue;
    buy(state, s.kind, s.def.id);
    autoEquip(state);
  }
}

function fight(state: GameState, enemies: (CombatantDef | null)[], rng: Rng): { won: boolean; gold: number } {
  const battle = new Battle(state.party, enemies, rng, { creatures: CREATURES, party: takeNextFight(state), bestiary: ENEMIES_BY_ID });
  while (!battle.result && battle.elapsed < MAX_FIGHT_SECONDS) {
    for (const event of battle.tick(DT)) {
      if (event.type !== 'equipmentBroken') continue;
      const member = state.party[battle.get(event.target).position];
      const item = member.equipment[event.slot];
      const equipment = { ...member.equipment };
      delete equipment[event.slot];
      replaceMember(state, member, { ...member, equipment });
      if (item) state.run!.broken.push(itemRef(item));
    }
  }
  return { won: battle.result === 'victory', gold: battle.gold };
}

function win(state: GameState, node: MapNode, type: NodeType, gold: number, rng: Rng): void {
  const run = state.run!;
  const payAs = type === 'event' ? 'epic' : type;
  const reward = rollReward(payAs, state.party, SKILL_LIBRARY, ITEM_LIBRARY, rng, gold, run.level);
  recordWin(run, { ...node, type }, reward);
  takeReward(state, rng);
}

function playRun(seed: number): Outcome {
  const rng = seededRng(seed * 7919 + 1);
  const state = createState();
  const starting = CLASSES.filter((c) => c.starting);
  const picked: ClassDef[] = [];
  while (picked.length < 3) {
    const c = starting[Math.floor(rng() * starting.length)];
    if (!picked.includes(c)) picked.push(c);
  }
  picked.sort((a, b) => FRONT_FIRST.indexOf(a.role) - FRONT_FIRST.indexOf(b.role));
  startRun(state, 0, picked, seed);
  const run = state.run!;
  let fights = 0;
  const party = picked.map((c) => c.id);
  const fought: string[] = [];
  const lose = (type: NodeType): Outcome => ({ won: false, act: run.level + 1, diedTo: type, party, fought, fights, gear: gearRanks(state) });

  while (!run.result) {
    const options = nextNodes(run);
    const node = options[Math.floor(rng() * options.length)];
    beginNode(run, node);
    const type = roomType(run, node);
    if (type === 'battle' || type === 'epic' || type === 'boss') {
      const encounter = pickEncounter(state, node)!;
      fought.push(`${run.level + 1}:${type}:${encounter.id}`);
      const result = fight(state, encounterEnemies(encounter), rng);
      fights += 1;
      if (!result.won) return lose(type);
      win(state, node, type, result.gold, rng);
    } else if (type === 'treasure') {
      win(state, node, type, 0, rng);
    } else if (type === 'store') {
      openStore(state, node);
      shop(state);
      clearNode(run, node.id);
    } else {
      const event = openEvent(state, node, EVENT_LIBRARY);
      const affordable = event.choices.map((c, i) => ({ c, i })).filter(({ c }) => canAfford(state, c));
      const choice = affordable[Math.floor(rng() * affordable.length)].i;
      const result = chooseOption(state, event, choice, rng)!;
      autoEquip(state);
      if (!result.fight) {
        clearNode(run, node.id);
        continue;
      }
      fought.push(`${run.level + 1}:event:${event.id}`);
      const enemies = result.fight.length > 0 ? result.fight.map((id) => ENEMIES.find((e) => e.id === id)!) : MAP_ENCOUNTER;
      const outcome = fight(state, enemies, rng);
      fights += 1;
      if (!outcome.won) return lose('event');
      win(state, node, type, outcome.gold, rng);
    }
  }
  return { won: true, act: run.level + 1, diedTo: null, party, fought, fights, gear: gearRanks(state) };
}

function gearRanks(state: GameState): number[] {
  return state.party.flatMap((m) => Object.values(m.equipment).map((i) => rank(i!)));
}

const pct = (n: number, d: number) => (d === 0 ? '-' : `${((100 * n) / d).toFixed(1)}%`);

describe.skipIf(!process.env.SIMULATE)('run simulation', () => {
  it(`plays ${RUNS} runs`, () => {
    const started = Date.now();
    const results = Array.from({ length: RUNS }, (_, i) => playRun(i + 1));
    const wins = results.filter((r) => r.won).length;
    const lines = [`Runs: ${RUNS}  Picks: ${BOTH_PICKS ? '1 skill + 1 item' : '1 card'}  (${((Date.now() - started) / 1000).toFixed(0)}s)`];
    lines.push(`Win rate: ${pct(wins, RUNS)}`);
    for (let act = 1; act <= 3; act++) {
      const reached = results.filter((r) => r.act >= act).length;
      const lost = results.filter((r) => !r.won && r.act === act);
      const by = (t: NodeType) => lost.filter((r) => r.diedTo === t).length;
      lines.push(
        `Act ${act}: reached ${pct(reached, RUNS)}, died here ${pct(lost.length, reached)} of arrivals ` +
          `(battle ${by('battle')}, epic ${by('epic')}, event ${by('event')}, boss ${by('boss')})`,
      );
    }
    const gear = results.flatMap((r) => r.gear);
    const counts = RARITIES.map((r, i) => `${r} ${pct(gear.filter((g) => g === i).length, gear.length)}`);
    lines.push(`Equipped gear at run end: ${counts.join(', ')}`);
    lines.push(`Avg fights per run: ${(results.reduce((s, r) => s + r.fights, 0) / RUNS).toFixed(1)}`);
    const losses = results.filter((r) => !r.won);
    const fights = new Map<string, { played: number; lost: number }>();
    for (const r of results) {
      r.fought.forEach((key, i) => {
        const f = fights.get(key) ?? { played: 0, lost: 0 };
        f.played += 1;
        if (!r.won && i === r.fought.length - 1) f.lost += 1;
        fights.set(key, f);
      });
    }
    lines.push('', 'Fights that ended runs (top 15 by losses):', 'Act  Type    Encounter            Played  Lost  Loss rate  Share of all losses');
    for (const [key, f] of [...fights].sort((a, b) => b[1].lost - a[1].lost).slice(0, 15)) {
      const [act, type, id] = key.split(':');
      lines.push(`${act.padEnd(5)}${type.padEnd(8)}${id.padEnd(21)}${String(f.played).padStart(6)}${String(f.lost).padStart(6)}${pct(f.lost, f.played).padStart(11)}${pct(f.lost, losses.length).padStart(21)}`);
    }
    lines.push('', 'Win rate by class (runs that included it):');
    for (const c of CLASSES.filter((x) => x.starting)) {
      const runs = results.filter((r) => r.party.includes(c.id));
      lines.push(`  ${c.id.padEnd(10)} ${pct(runs.filter((r) => r.won).length, runs.length).padStart(6)}  (${runs.length} runs)`);
    }
    process.stdout.write(`\n${lines.join('\n')}\n`);
  });
});
