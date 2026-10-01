import type { EventDef } from '../run/events';

// Draft events for building the event screen; the full set is written next and reviewed as a list.
export const EVENT_LIBRARY: EventDef[] = [
  {
    id: 'forgottenShrine',
    title: 'THE FORGOTTEN SHRINE',
    art: 'shrine',
    text: 'A CRACKED SHRINE GLOWS FAINTLY IN THE DARK. OLD OFFERINGS STILL LIE AT ITS FEET.',
    choices: [
      {
        label: 'PRAY AT THE SHRINE',
        check: { stat: 'magic', mode: 'highest', difficulty: 20 },
        success: { text: 'WARM LIGHT FILLS YOU.', outcomes: [{ kind: 'blessed', bonus: { attack: 4, magic: 4 } }] },
        failure: { text: 'THE LIGHT TURNS COLD AND STINGS.', outcomes: [{ kind: 'wounded' }] },
      },
      { label: 'TAKE THE OFFERINGS', success: { text: 'YOU POCKET THE COINS.', outcomes: [{ kind: 'gold', amount: 40 }, { kind: 'wounded' }] } },
      { label: 'LEAVE IT BE', success: { text: 'YOU MOVE ON.', outcomes: [] } },
    ],
  },
  {
    id: 'lockedChest',
    title: 'A LOCKED CHEST',
    art: 'chest',
    text: 'AN IRON-BOUND CHEST BLOCKS THE PATH. SOMETHING SHUFFLES BEHIND IT.',
    choices: [
      {
        label: 'FORCE IT OPEN',
        check: { stat: 'attack', mode: 'total', difficulty: 40 },
        success: { text: 'THE LID GIVES WAY.', outcomes: [{ kind: 'item' }] },
        failure: { text: 'THE NOISE DRAWS A CROWD!', outcomes: [{ kind: 'fight' }] },
      },
      { label: 'CHECK BEHIND IT', success: { text: 'AN AMBUSH!', outcomes: [{ kind: 'fight', enemies: ['orc', 'orc'] }] } },
    ],
  },
];
