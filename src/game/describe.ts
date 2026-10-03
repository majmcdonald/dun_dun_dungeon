import type { Condition, Enchantment, Selector, SkillEffect, StatKey, Stats, Targeting, Trigger } from '../combat/types';

const STAT: Record<keyof Stats, string> = { hp: 'HP', attack: 'ATK', magic: 'MAG', defense: 'DEF', resistance: 'RES' };

const pct = (n: number) => `${Math.round(n * 100)}%`;

export function describeStat(key: StatKey | keyof Stats): string {
  return STAT[key];
}

function describeBase(e: SkillEffect): string {
  switch (e.kind) {
    case 'damage': {
      const element = e.element ? ` ${e.element.toUpperCase()}` : '';
      const hits = e.hits && e.hits > 1 ? ` X${e.hits}` : '';
      const drain = e.drain ? `, DRAIN ${pct(e.drain)}` : '';
      const zeal = e.vsCasters ? `, +${pct(e.vsCasters.bonus)} VS CASTERS, -${pct(e.vsCasters.penalty)} OTHERS` : '';
      return `${pct(e.scaling)} ${STAT[e.stat]} ${e.damageType.toUpperCase()}${element}${hits}${drain}${zeal}`;
    }
    case 'barrier':
      return `BARRIER ${pct(e.scaling)} ${STAT[e.stat]} FOR ${e.duration}S`;
    case 'heal':
      return `HEAL ${pct(e.scaling)} MAG`;
    case 'regen':
      return `REGEN ${pct(e.scaling)} MAG/S FOR ${e.duration}S`;
    case 'dot': {
      const element = e.element ? ` ${e.element.toUpperCase()}` : '';
      return `${pct(e.scaling)} ${STAT[e.stat]}${element}/S FOR ${e.duration}S`;
    }
    case 'buff':
      return `+${e.amount} ${STAT[e.stat]} FOR ${e.duration}S`;
    case 'debuff':
      return `-${e.amount} ${STAT[e.stat]} FOR ${e.duration}S`;
    case 'siphon':
      return `STEAL ${e.amount} ${STAT[e.stat]} FOR ${e.duration}S`;
    case 'steal':
      return 'STEAL A BUFF';
    case 'speed':
      return e.factor < 1 ? `SLOW ${pct(1 - e.factor)} FOR ${e.duration}S` : `HASTE +${pct(e.factor - 1)} FOR ${e.duration}S`;
    case 'transform':
      return `TRANSFORM INTO A CRITTER FOR ${e.duration}S`;
    case 'taunt':
      return `TAUNT FOR ${e.duration}S`;
    case 'delay':
      return `PUSH TIMERS BACK ${e.seconds}S`;
    case 'shapeshift':
      return `SHAPESHIFT ${e.duration}S: FORM SKILLS +${pct(e.bonus)}, OTHERS PAUSE`;
    case 'gold':
      return `+${e.amount} GOLD`;
    case 'meter':
      return `+${e.amount} METER`;
    case 'selfDamage':
      return `LOSE ${pct(e.fraction)} MAX HP`;
    case 'summon':
      return `SUMMON ${e.creature.toUpperCase()} (${pct(e.share)} OF STATS)`;
    case 'spawn':
      return `CALL ${e.count} ${e.enemy.toUpperCase()} (MAX ${e.cap})`;
    case 'consumeSummon':
      return 'SACRIFICE A SUMMON';
    case 'chaos':
      return `RANDOM: ${e.options.map(describeBase).join(' / ')}`;
  }
}

export function describeEffect(e: SkillEffect): string {
  if (e.onSummons) return `SUMMONS: ${describeBase(e)}`;
  return e.self ? `SELF: ${describeBase(e)}` : describeBase(e);
}

export function describeTrigger(t: Trigger): string {
  switch (t.kind) {
    case 'whenHit':
      return `FILLS ${t.perEvent}S EACH TIME HIT`;
    case 'allyHurt':
      return `FILLS ${t.perEvent}S EACH TIME AN ALLY IS HURT`;
    case 'partyLow':
      return `RUNS WHILE PARTY HP BELOW ${pct(t.threshold)}`;
    case 'onDefeat':
      return 'FIRES WHEN DEFEATED';
    case 'belowHp':
      return `FIRES ONCE BELOW ${pct(t.threshold)} HP`;
  }
}

export function describeCondition(c: Condition): string {
  switch (c.kind) {
    case 'frenzy':
      return 'ONLY DURING FRENZY';
    case 'souls':
      return `SPENDS ${c.cost} SOUL${c.cost > 1 ? 'S' : ''}`;
    case 'onlyJewelry':
      return 'ONLY WEARING JEWELRY ALONE';
    case 'chiBurst':
      return 'ONLY DURING CHI BURST';
    case 'chiFilling':
      return 'NOT DURING CHI BURST';
    case 'hasSummon':
      return 'NEEDS A SUMMON';
    case 'shapeshifted':
      return 'ONLY WHILE SHAPESHIFTED';
  }
}

export function describeEnchantment(e: Enchantment): string {
  switch (e.kind) {
    case 'taunt':
      return 'TAUNT: DRAWS SINGLE-TARGET ATTACKS';
    case 'resist':
      return `RESIST ${pct(e.amount)} ${e.element.toUpperCase()}`;
    case 'thorns':
      return `THORNS: REFLECT ${pct(e.fraction)} OF DAMAGE`;
    case 'onHit':
      return `ON HIT (${pct(e.chance)}): ${describeEffect(e.effect)}`;
    case 'onHitTaken':
      return `WHEN HIT (${pct(e.chance)}): ${describeEffect(e.effect)}`;
    case 'onAllyDeath':
      return `ALLY FALLS: ${describeEffect(e.effect)}`;
  }
}

const SELECTOR: Record<Selector, string> = {
  front: 'FRONT',
  back: 'BACK',
  random: 'RANDOM',
  lowestHpPct: 'LOWEST HP%',
  highestHpPct: 'HIGHEST HP%',
  lowestHp: 'LOWEST HP',
  highestHp: 'HIGHEST HP',
  attackedMe: 'LAST ATTACKER',
  mostDamage: 'TOP DAMAGE DEALER',
  castSpell: 'SPELLCASTER',
  castDefensive: 'DEFENSIVE CASTER',
};

export function describeTarget(t: Targeting): string {
  if (t.side === 'self') return 'SELF';
  if (t.side === 'summons') return t.area === 'all' ? 'ALL MY SUMMONS' : 'MY SUMMON';
  const who = t.side === 'enemy' ? 'ENEMY' : 'ALLY';
  if (t.area === 'all') return t.side === 'enemy' ? 'ALL ENEMIES' : 'ALL ALLIES';
  const base = `${SELECTOR[t.select]} ${who}`;
  return t.area === 'single' ? base : `${base} + ${t.area.toUpperCase()}`;
}
