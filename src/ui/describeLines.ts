import { PALETTE } from '../art/palette';
import type { EquipmentDef, SkillDef } from '../combat/types';
import { SKILLS_BY_ID } from '../content/skills';
import { describeCondition, describeEffect, describeEnchantment, describeTarget, describeTrigger } from '../game/describe';
import { SLOT_LABEL, STAT_LABEL } from './partyCard';
import { RARITY_COLOR } from './widgets';

// Colored text lines describing a skill or item, shared by the loadout and reward screens.

export interface Line {
  text: string;
  color: string;
}

export function skillLines(skill: SkillDef): Line[] {
  const lines = [
    {
      text: `${skill.name.toUpperCase()}  ${skill.rarity.toUpperCase()}  ${skill.cooldown.toFixed(1)}S  ${describeTarget(skill.target)}`,
      color: RARITY_COLOR[skill.rarity],
    },
    { text: skill.effects.map(describeEffect).join(', '), color: PALETTE.lightGray },
  ];
  const notes = [
    skill.trigger && describeTrigger(skill.trigger),
    skill.condition && describeCondition(skill.condition),
    skill.prerequisite && `NEEDS ${SKILLS_BY_ID[skill.prerequisite]?.name.toUpperCase()}`,
    skill.synergy && `SYNERGY: +${Math.round(skill.synergy.bonus * 100)}% WITH ${SKILLS_BY_ID[skill.synergy.with]?.name.toUpperCase()}`,
  ].filter((n): n is string => !!n);
  if (notes.length > 0) lines.push({ text: notes.join('. '), color: PALETTE.magenta });
  return lines;
}

export function itemLines(item: EquipmentDef): Line[] {
  const lines = [{ text: `${item.name.toUpperCase()}  ${item.rarity.toUpperCase()}  ${SLOT_LABEL[item.slot]}`, color: RARITY_COLOR[item.rarity] }];
  const bonuses = STAT_LABEL.filter(([k]) => item.stats[k]).map(([k, label]) => `+${item.stats[k]} ${label}`);
  if (bonuses.length > 0) lines.push({ text: bonuses.join('  '), color: PALETTE.green });
  if (item.enchantment) lines.push({ text: describeEnchantment(item.enchantment), color: PALETTE.orange });
  if (item.requires) lines.push({ text: `REQUIRES ${item.requires.toUpperCase()}`, color: PALETTE.magenta });
  if (item.boost) lines.push({ text: `ENCHANTED: +${item.boost.amount} ${statLabel(item.boost.stat)}`, color: PALETTE.cyan });
  return lines;
}

export function wrap(text: string, maxChars: number): string[] {
  const lines: string[] = [];
  let current = '';
  for (const word of text.split(' ')) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else current = next;
  }
  if (current) lines.push(current);
  return lines;
}

function statLabel(stat: string): string {
  return STAT_LABEL.find(([k]) => k === stat)?.[1] ?? stat.toUpperCase();
}
