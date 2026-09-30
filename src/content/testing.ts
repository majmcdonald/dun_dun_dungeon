import type { PartyMember } from '../combat/types';
import { CLASSES_BY_ID } from './classes';
import { equipItemBlock } from '../game/loadout';
import { EQUIP_SLOTS } from '../combat/types';
import { ITEM_LIBRARY, ITEMS_BY_ID } from './items';
import { SKILLS_BY_ID } from './skills';

// Fixed geared party used by the encounter-winnability test.
export function testParty(): PartyMember[] {
  const member = (id: string, gear: string[]): PartyMember => {
    const def = CLASSES_BY_ID[id];
    return {
      def,
      skills: def.skills,
      equipment: Object.fromEntries(gear.map((g) => [ITEMS_BY_ID[g].slot, ITEMS_BY_ID[g]])),
    };
  };
  return [
    member('knight', ['tauntHelm', 'scaleMail', 'ironBoots', 'longsword']),
    member('mage', ['clothRobe', 'oakStaff']),
    member('cleric', ['holySymbol', 'leatherBoots']),
  ];
}

// Dev-only: extra skills that make each class show off its mechanic, summons, or statuses in battle.
const DEMO_SKILLS: Record<string, string[]> = {
  knight: ['bodyguard'],
  mage: ['polymorph', 'chaosOrb'],
  ranger: ['callWolf', 'callHawk'],
  necromancer: ['raiseSkeleton', 'raiseZombie'],
  druid: ['catForm', 'summonBoar'],
  warlock: ['bloodBond'],
};

// Party (with rare gear) from a comma-separated class list, e.g. ?party=necromancer,warlock,barbarian. Unknown ids are skipped.
export function demoParty(ids: string): PartyMember[] {
  return ids
    .split(',')
    .filter((id) => CLASSES_BY_ID[id])
    .slice(0, 3)
    .map((id) => {
      const def = CLASSES_BY_ID[id];
      const extra = (DEMO_SKILLS[id] ?? []).map((s) => SKILLS_BY_ID[s]);
      const member: PartyMember = { def, skills: [...def.skills, ...extra].slice(0, 4), equipment: {} };
      for (const slot of EQUIP_SLOTS) {
        const item = ITEM_LIBRARY.find((i) => i.slot === slot && i.rarity === 'rare' && !equipItemBlock(member, i));
        if (item) member.equipment[slot] = item;
      }
      return member;
    });
}
