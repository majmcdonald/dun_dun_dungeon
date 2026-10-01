import type { PartyMember } from '../combat/types';
import { CLASSES_BY_ID } from './classes';
import { ITEMS_BY_ID } from './items';

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
