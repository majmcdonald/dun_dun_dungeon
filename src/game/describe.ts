import type { Enchantment, Selector, SkillEffect, StatKey, Stats, Targeting } from '../combat/types';

const STAT: Record<keyof Stats, string> = { hp: 'HP', attack: 'ATK', magic: 'MAG', defense: 'DEF', resistance: 'RES' };

const pct = (n: number) => `${Math.round(n * 100)}%`;

export function describeStat(key: StatKey | keyof Stats): string {
  return STAT[key];
}

export function describeEffect(e: SkillEffect): string {
  switch (e.kind) {
    case 'damage': {
      const element = e.element ? ` ${e.element.toUpperCase()}` : '';
      const hits = e.hits && e.hits > 1 ? ` X${e.hits}` : '';
      const drain = e.drain ? `, DRAIN ${pct(e.drain)}` : '';
      return `${pct(e.scaling)} ${STAT[e.stat]} ${e.damageType.toUpperCase()}${element}${hits}${drain}`;
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
  const who = t.side === 'enemy' ? 'ENEMY' : 'ALLY';
  if (t.area === 'all') return t.side === 'enemy' ? 'ALL ENEMIES' : 'ALL ALLIES';
  const base = `${SELECTOR[t.select]} ${who}`;
  return t.area === 'single' ? base : `${base} + ${t.area.toUpperCase()}`;
}
