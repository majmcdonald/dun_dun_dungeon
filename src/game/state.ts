import { testParty } from '../combat/data';
import type { PartyMember } from '../combat/types';

export interface GameState {
  party: PartyMember[];
}

export function createState(): GameState {
  return { party: testParty() };
}
