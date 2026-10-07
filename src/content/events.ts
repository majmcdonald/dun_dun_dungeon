import type { EventDef } from '../run/events';

// Text events for Event rooms. Difficulties assume a fresh party (best ATK/MAG about 18, party totals about 40);
// gear raises the odds as a run goes on.
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
      { label: 'TAKE THE OFFERINGS', success: { text: 'YOU POCKET THE COINS. THE SHRINE DIMS.', outcomes: [{ kind: 'gold', amount: 40 }, { kind: 'wounded' }] } },
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
      { label: 'WALK AROUND IT', success: { text: 'YOU SQUEEZE PAST.', outcomes: [] } },
    ],
  },
  {
    id: 'wanderingMerchant',
    title: 'THE WANDERING MERCHANT',
    art: 'merchant',
    text: 'A HOODED MERCHANT OFFERS A MYSTERY BOX. "ONLY 50 GOLD, FRIEND. NO PEEKING."',
    choices: [
      { label: 'BUY THE BOX (50 GOLD)',
        cost: 50, success: { text: 'YOU OPEN IT. NOT BAD!', outcomes: [{ kind: 'gold', amount: -50 }, { kind: 'item', rarity: 'rare' }] } },
      {
        label: 'HAGGLE',
        cost: 25,
        check: { stat: 'magic', mode: 'highest', difficulty: 22 },
        success: { text: '"FINE, FINE. 25 GOLD."', outcomes: [{ kind: 'gold', amount: -25 }, { kind: 'item', rarity: 'rare' }] },
        failure: { text: 'HE SNIFFS AND VANISHES INTO THE DARK.', outcomes: [] },
      },
      { label: 'WALK AWAY', success: { text: '"YOUR LOSS."', outcomes: [] } },
    ],
  },
  {
    id: 'ropeBridge',
    title: 'THE ROPE BRIDGE',
    art: 'bridge',
    text: 'A ROPE BRIDGE SWAYS OVER A DEEP CHASM. HALF ITS PLANKS ARE MISSING. A PURSE GLINTS ON THE FAR SIDE.',
    choices: [
      {
        label: 'CROSS CAREFULLY',
        check: { stat: 'defense', mode: 'highest', difficulty: 22 },
        success: { text: 'YOU MAKE IT ACROSS AND GRAB THE PURSE.', outcomes: [{ kind: 'gold', amount: 45 }] },
        failure: { text: 'A PLANK SNAPS. YOU HANG ON, BUT SOMETHING FALLS.', outcomes: [{ kind: 'wounded' }, { kind: 'loseItem' }] },
      },
      { label: 'CLIMB DOWN AND AROUND', success: { text: 'A LONG, BRUISING CLIMB.', outcomes: [{ kind: 'wounded' }] } },
    ],
  },
  {
    id: 'goblinToll',
    title: 'THE GOBLIN TOLL',
    art: 'goblins',
    text: 'THREE GOBLINS BLOCK THE CORRIDOR. "TOLL IS 30 GOLD. EACH." THEY GIGGLE.',
    choices: [
      { label: 'PAY (30 GOLD)',
        cost: 30, success: { text: 'THEY COUNT IT TWICE AND LET YOU PASS.', outcomes: [{ kind: 'gold', amount: -30 }] } },
      {
        label: 'INTIMIDATE THEM',
        check: { stat: 'attack', mode: 'highest', difficulty: 24 },
        success: { text: 'THEY DROP THEIR PURSES AND RUN.', outcomes: [{ kind: 'gold', amount: 35 }] },
        failure: { text: 'THEY STOP GIGGLING. AND CALL FRIENDS.', outcomes: [{ kind: 'fight', enemies: ['bat', 'slime', 'bat'] }] },
      },
      { label: 'ATTACK', success: { text: 'STEEL OUT!', outcomes: [{ kind: 'fight', enemies: ['slime', 'bat', 'slime'] }] } },
    ],
  },
  {
    id: 'clearSpring',
    title: 'THE CLEAR SPRING',
    art: 'spring',
    text: 'ICE-COLD WATER BUBBLES UP BETWEEN THE STONES. IT HUMS WITH SOMETHING OLD.',
    choices: [
      { label: 'DRINK', success: { text: 'YOU FEEL STRONGER.', outcomes: [{ kind: 'blessed', bonus: { hp: 20 } }] } },
      {
        label: 'BATHE IN IT',
        check: { stat: 'resistance', mode: 'total', difficulty: 40 },
        success: { text: 'YOUR SKIN TINGLES AND HARDENS.', outcomes: [{ kind: 'blessed', bonus: { defense: 4, resistance: 4 } }] },
        failure: { text: 'THE COLD BITES TO THE BONE.', outcomes: [{ kind: 'wounded' }] },
      },
      { label: 'MOVE ON', success: { text: 'YOU LEAVE IT UNTOUCHED.', outcomes: [] } },
    ],
  },
  {
    id: 'pinnedAdventurer',
    title: 'THE PINNED ADVENTURER',
    art: 'adventurer',
    text: 'AN ADVENTURER LIES PINNED UNDER FALLEN STONES. "PLEASE... I CAN TEACH YOU THINGS."',
    choices: [
      {
        label: 'LIFT THE STONES',
        check: { stat: 'attack', mode: 'total', difficulty: 45 },
        success: { text: 'SHE STANDS, SHAKY BUT GRATEFUL, AND SHOWS YOU A TRICK.', outcomes: [{ kind: 'skill', rarity: 'rare' }] },
        failure: { text: 'THE STONES SHIFT AND CRUSH YOUR HANDS.', outcomes: [{ kind: 'wounded' }] },
      },
      { label: 'TAKE HER PACK', success: { text: 'YOU TAKE IT. SHE CURSES YOU AS YOU GO.', outcomes: [{ kind: 'item' }, { kind: 'gold', amount: 15 }] } },
      { label: 'LEAVE', success: { text: 'HER CRIES FOLLOW YOU DOWN THE HALL.', outcomes: [] } },
    ],
  },
  {
    id: 'goldenIdol',
    title: 'THE GOLDEN IDOL',
    art: 'idol',
    text: 'A GOLDEN IDOL RESTS ON A PEDESTAL RINGED WITH BONES. THE FLOOR TILES LOOK LOOSE.',
    choices: [
      { label: 'GRAB IT AND RUN', success: { text: 'DARTS FLY. YOU ESCAPE WITH THE IDOL.', outcomes: [{ kind: 'gold', amount: 80 }, { kind: 'wounded' }] } },
      {
        label: 'SWAP IT FOR A STONE',
        check: { stat: 'resistance', mode: 'highest', difficulty: 18 },
        success: { text: 'A STEADY HAND. NOTHING STIRS.', outcomes: [{ kind: 'gold', amount: 80 }] },
        failure: { text: 'THE BONES RISE!', outcomes: [{ kind: 'fight', enemies: ['archer', 'archer', 'archer'] }] },
      },
      { label: 'LEAVE IT', success: { text: 'SOME TREASURES ARE NOT WORTH IT.', outcomes: [] } },
    ],
  },
  {
    id: 'bonesAndDice',
    title: 'BONES AND DICE',
    art: 'dice',
    text: 'A SKELETON SITS AT A TABLE, RATTLING DICE IN A CUP. "DOUBLE OR NOTHING?"',
    choices: [
      {
        label: 'BET 40 GOLD',
        cost: 40,
        chance: 0.5,
        success: { text: 'SIXES! IT PAYS UP.', outcomes: [{ kind: 'gold', amount: 40 }] },
        failure: { text: 'SNAKE EYES. IT CACKLES.', outcomes: [{ kind: 'gold', amount: -40 }] },
      },
      {
        label: 'CHEAT',
        check: { stat: 'magic', mode: 'highest', difficulty: 24 },
        success: { text: 'THE DICE OBEY YOUR WILL.', outcomes: [{ kind: 'gold', amount: 70 }] },
        failure: { text: '"CHEATER!" ITS FRIENDS STAND UP.', outcomes: [{ kind: 'fight', enemies: ['archer', 'archer'] }] },
      },
      { label: 'DECLINE', success: { text: '"SUIT YOURSELF."', outcomes: [] } },
    ],
  },
  {
    id: 'dustyLibrary',
    title: 'THE DUSTY LIBRARY',
    art: 'library',
    text: 'SHELVES OF CRUMBLING TOMES LINE A FORGOTTEN STUDY. ONE BOOK IS STILL WARM.',
    choices: [
      {
        label: 'STUDY THE WARM BOOK',
        check: { stat: 'magic', mode: 'total', difficulty: 40 },
        success: { text: 'THE WORDS BURN INTO YOUR MIND.', outcomes: [{ kind: 'skill', rarity: 'epic' }] },
        failure: { text: 'THE BOOK BITES BACK.', outcomes: [{ kind: 'wounded' }] },
      },
      { label: 'SKIM A FEW BOOKS', success: { text: 'YOU PICK UP A THING OR TWO.', outcomes: [{ kind: 'skill', rarity: 'common' }] } },
      { label: 'LEAVE', success: { text: 'YOU LEAVE THE DUST UNDISTURBED.', outcomes: [] } },
    ],
  },
  {
    id: 'oldBattlefield',
    title: 'THE OLD BATTLEFIELD',
    art: 'battlefield',
    text: 'RUSTED ARMOR AND BROKEN WEAPONS LITTER AN ANCIENT BATTLEFIELD.',
    choices: [
      { label: 'SEARCH THE EDGES', success: { text: 'SOMETHING STILL USABLE.', outcomes: [{ kind: 'item', rarity: 'common' }] } },
      {
        label: 'SEARCH THE CENTER',
        check: { stat: 'defense', mode: 'highest', difficulty: 24 },
        success: { text: 'A FALLEN CAPTAIN\'S GEAR, WELL KEPT.', outcomes: [{ kind: 'item', rarity: 'rare' }, { kind: 'item' }] },
        failure: { text: 'THE DEAD DO NOT WANT VISITORS.', outcomes: [{ kind: 'fight', enemies: ['archer', 'orc', 'archer'] }] },
      },
    ],
  },
  {
    id: 'sleepingOrc',
    title: 'THE SLEEPING ORC',
    art: 'sleepingOrc',
    text: 'A HUGE ORC SNORES ON A PILE OF COINS, ONE HAND ON HIS AXE.',
    choices: [
      {
        label: 'STEAL SOME COINS',
        chance: 0.5,
        success: { text: 'HE MUMBLES AND ROLLS OVER.', outcomes: [{ kind: 'gold', amount: 70 }] },
        failure: { text: 'ONE EYE OPENS.', outcomes: [{ kind: 'fight', enemies: ['orc'] }] },
      },
      { label: 'ATTACK HIM', success: { text: 'BETTER AWAKE THAN BEHIND YOU.', outcomes: [{ kind: 'fight', enemies: ['orc'] }] } },
      { label: 'SNEAK PAST', success: { text: 'NOT TODAY, BIG ONE.', outcomes: [] } },
    ],
  },
  {
    id: 'hummingPortal',
    title: 'THE HUMMING PORTAL',
    art: 'portal',
    text: 'A SHIMMERING PORTAL HUMS IN THE WALL. YOU HEAR CHEERING ON THE OTHER SIDE.',
    choices: [
      {
        label: 'STEP THROUGH',
        chance: 0.5,
        success: { text: 'A CROWD OF SPIRITS CHEERS YOU ON.', outcomes: [{ kind: 'blessed', bonus: { attack: 6, magic: 6 } }] },
        failure: { text: 'IT SPITS YOU BACK OUT, LIGHTER IN THE PURSE.', outcomes: [{ kind: 'wounded' }, { kind: 'gold', amount: -20 }] },
      },
      { label: 'TOSS IN A COIN (10 GOLD)',
        cost: 10, success: { text: 'IT HUMS HAPPILY. YOU FEEL LUCKY.', outcomes: [{ kind: 'gold', amount: -10 }, { kind: 'blessed', bonus: { hp: 10 } }] } },
      { label: 'LEAVE', success: { text: 'THE CHEERING FADES.', outcomes: [] } },
    ],
  },
  {
    id: 'oldMentor',
    title: 'THE OLD MENTOR',
    art: 'mentor',
    text: 'A GREY-BEARDED WARRIOR SITS BY A FIRE. "SHOW ME WHAT YOU\'VE GOT."',
    choices: [
      {
        label: 'SPAR WITH HIM',
        check: { stat: 'attack', mode: 'highest', difficulty: 26 },
        success: { text: '"NOT BAD. NOW TRY THIS."', outcomes: [{ kind: 'skill', rarity: 'rare' }, { kind: 'blessed', bonus: { attack: 3 } }] },
        failure: { text: 'HE PUTS YOU ON THE GROUND. TWICE.', outcomes: [{ kind: 'wounded' }] },
      },
      { label: 'WATCH AND LEARN', success: { text: 'YOU STUDY HIS FORM.', outcomes: [{ kind: 'skill', rarity: 'common' }] } },
      { label: 'SHARE THE FIRE', success: { text: 'A WARM MEAL AND OLD STORIES.', outcomes: [{ kind: 'blessed', bonus: { hp: 15 } }] } },
    ],
  },
  {
    id: 'batCloud',
    title: 'THE BAT CLOUD',
    art: 'bats',
    text: 'THE CEILING SHIVERS. A CLOUD OF BATS BURSTS DOWN THE TUNNEL TOWARD YOU.',
    choices: [
      { label: 'FIGHT THEM', success: { text: 'WEAPONS UP!', outcomes: [{ kind: 'fight', enemies: ['bat', 'bat', 'bat', 'bat', 'bat'] }] } },
      {
        label: 'COVER UP',
        check: { stat: 'defense', mode: 'total', difficulty: 45 },
        success: { text: 'THEY PASS OVER YOU HARMLESSLY.', outcomes: [] },
        failure: { text: 'CLAWS AND TEETH EVERYWHERE.', outcomes: [{ kind: 'wounded' }] },
      },
      { label: 'RUN', success: { text: 'YOU ESCAPE, BUT DROP SOME COINS.', outcomes: [{ kind: 'gold', amount: -15 }] } },
    ],
  },
  {
    id: 'ghostSmith',
    title: 'THE GHOST SMITH',
    art: 'forge',
    text: 'THE GHOST OF A BLACKSMITH HAMMERS AT A COLD FORGE. "BRING ME GOLD, AND I WILL MAKE YOU SOMETHING."',
    choices: [
      { label: 'PAY 60 GOLD',
        cost: 60, success: { text: 'HE HANDS YOU A FINE PIECE, STILL GLOWING.', outcomes: [{ kind: 'gold', amount: -60 }, { kind: 'item', rarity: 'epic' }] } },
      {
        label: 'OFFER TO WORK THE BELLOWS',
        check: { stat: 'hp', mode: 'total', difficulty: 360 },
        success: { text: '"HARD WORK DESERVES PAY."', outcomes: [{ kind: 'item', rarity: 'rare' }] },
        failure: { text: 'THE HEAT IS TOO MUCH.', outcomes: [{ kind: 'wounded' }] },
      },
      { label: 'LEAVE', success: { text: 'THE HAMMERING FOLLOWS YOU OUT.', outcomes: [] } },
    ],
  },

  // --- Act 1 events: all good for the party (the worst case is a small setback).
  {
    id: 'lostCaravan',
    act: 0,
    title: 'THE LOST CARAVAN',
    art: 'caravan',
    text: 'A MERCHANT CART LIES ON ITS SIDE. ITS DRIVER IS PINNED BENEATH, CALLING FOR HELP.',
    choices: [
      {
        label: 'LIFT THE CART',
        check: { stat: 'attack', mode: 'highest', difficulty: 18 },
        success: { text: 'THE DRIVER THANKS YOU WITH WARES AND COIN.', outcomes: [{ kind: 'item' }, { kind: 'gold', amount: 30 }] },
        failure: { text: 'YOU STRAIN SOMETHING, BUT HE CRAWLS FREE.', outcomes: [{ kind: 'wounded' }] },
      },
      {
        label: 'SEARCH THE WRECK',
        chance: 0.7,
        success: { text: 'A FINE PIECE OF GEAR, STILL WRAPPED.', outcomes: [{ kind: 'item', rarity: 'rare' }] },
        failure: { text: 'NOTHING BUT BROKEN CRATES.', outcomes: [] },
      },
      { label: 'LEAVE', success: { text: 'YOU MOVE ON.', outcomes: [] } },
    ],
  },
  {
    id: 'hedgeWitch',
    act: 0,
    title: 'THE HEDGE WITCH',
    art: 'witch',
    text: 'AN OLD WOMAN STIRS A BUBBLING POT AND OFFERS YOU A TASTE.',
    choices: [
      {
        label: 'DRINK',
        chance: 0.8,
        success: { text: 'IT BURNS ALL THE WAY DOWN. YOU FEEL MIGHTY.', outcomes: [{ kind: 'blessed', bonus: { attack: 4, magic: 4 } }] },
        failure: { text: 'YOUR STOMACH TURNS.', outcomes: [{ kind: 'wounded' }] },
      },
      { label: 'BUY A CHARM (40 GOLD)', cost: 40, success: { text: 'SHE TEACHES YOU A TRICK.', outcomes: [{ kind: 'gold', amount: -40 }, { kind: 'skill', rarity: 'rare' }] } },
      { label: 'LEAVE', success: { text: 'SHE CACKLES AS YOU GO.', outcomes: [] } },
    ],
  },
  {
    id: 'trainingYard',
    act: 0,
    title: 'THE TRAINING YARD',
    art: 'dummies',
    text: 'AN ABANDONED PRACTICE YARD: STRAW DUMMIES, RACKS OF DULL BLADES, A SHELF OF OLD MANUALS.',
    choices: [
      {
        label: 'SPAR',
        check: { stat: 'attack', mode: 'total', difficulty: 32 },
        success: { text: 'A NEW TECHNIQUE CLICKS.', outcomes: [{ kind: 'skill' }] },
        failure: { text: 'YOU LEARN LITTLE.', outcomes: [] },
      },
      {
        label: 'STUDY THE MANUALS',
        check: { stat: 'magic', mode: 'highest', difficulty: 18 },
        success: { text: 'THE MARGINS HOLD A SECRET.', outcomes: [{ kind: 'skill' }] },
        failure: { text: 'THE PAGES CRUMBLE.', outcomes: [] },
      },
      { label: 'REST', success: { text: 'YOU WAKE SHARP AND READY.', outcomes: [{ kind: 'blessed', bonus: { defense: 4, resistance: 4 } }] } },
    ],
  },
  {
    id: 'fairyRing',
    act: 0,
    title: 'THE FAIRY RING',
    art: 'fairyRing',
    text: 'A CIRCLE OF GLOWING MUSHROOMS HUMS WITH A TUNE ONLY YOU CAN HEAR.',
    choices: [
      {
        label: 'DANCE',
        chance: 0.75,
        success: { text: 'THE MUSIC FILLS YOUR MIND WITH SOMETHING NEW.', outcomes: [{ kind: 'skill', rarity: 'epic' }] },
        failure: { text: 'YOU STUMBLE OUT, DIZZY.', outcomes: [{ kind: 'wounded' }] },
      },
      { label: 'PICK MUSHROOMS', success: { text: 'THEY WILL FETCH A GOOD PRICE.', outcomes: [{ kind: 'gold', amount: 30 }] } },
      { label: 'LEAVE', success: { text: 'THE TUNE FADES BEHIND YOU.', outcomes: [] } },
    ],
  },
  // --- Act 2 events: two good, two bad.
  {
    id: 'mountainHermit',
    act: 1,
    title: 'THE MOUNTAIN HERMIT',
    art: 'hermit',
    text: 'A SAGE SITS IN A COLD CAVE, BREWING TEA. HE OFFERS TO SHARE WHAT HE KNOWS.',
    choices: [
      {
        label: 'MEDITATE WITH HIM',
        check: { stat: 'magic', mode: 'highest', difficulty: 30 },
        success: { text: 'HIS WISDOM TAKES ROOT.', outcomes: [{ kind: 'skill', rarity: 'epic' }] },
        failure: { text: 'YOUR MIND WANDERS.', outcomes: [] },
      },
      { label: 'HELP WITH CHORES', success: { text: 'HE PAYS IN COIN AND KIND WORDS.', outcomes: [{ kind: 'gold', amount: 50 }, { kind: 'blessed', bonus: { attack: 6, magic: 6 } }] } },
      { label: 'LEAVE', success: { text: 'HE NODS AND RETURNS TO HIS TEA.', outcomes: [] } },
    ],
  },
  {
    id: 'frozenHoard',
    act: 1,
    title: 'THE FROZEN HOARD',
    art: 'hoard',
    text: "UNDER A SHEET OF ICE LIES AN OLD DRAGON'S STASH, GLITTERING.",
    choices: [
      {
        label: 'BREAK THE ICE',
        check: { stat: 'attack', mode: 'total', difficulty: 52 },
        success: { text: 'THE ICE SHATTERS. TREASURE!', outcomes: [{ kind: 'item', rarity: 'epic' }] },
        failure: { text: 'SHARDS FLY BACK AT YOU.', outcomes: [{ kind: 'wounded' }] },
      },
      {
        label: 'MELT IT',
        check: { stat: 'magic', mode: 'total', difficulty: 54 },
        success: { text: 'THE ICE RUNS AWAY IN STREAMS.', outcomes: [{ kind: 'item', rarity: 'rare' }, { kind: 'gold', amount: 60 }] },
        failure: { text: 'THE ICE HOLDS.', outcomes: [] },
      },
      { label: 'LEAVE', success: { text: 'YOU LEAVE IT TO THE COLD.', outcomes: [] } },
    ],
  },
  {
    id: 'banditAmbush',
    act: 1,
    title: 'BANDIT AMBUSH',
    art: 'ambush',
    text: 'BANDITS STEP OUT FROM THE ROCKS ON EVERY SIDE. "YOUR GOLD OR YOUR LIVES."',
    choices: [
      { label: 'PAY THE TOLL (100 GOLD)', cost: 100, success: { text: 'THEY COUNT IT TWICE AND LET YOU PASS.', outcomes: [{ kind: 'gold', amount: -100 }] } },
      { label: 'FIGHT', success: { text: 'THEY ATTACK!', outcomes: [{ kind: 'fight', enemies: ['bandit', 'bandit', 'bandit', 'harpy'] }] } },
      {
        label: 'RUN',
        chance: 0.5,
        success: { text: 'YOU SLIP AWAY.', outcomes: [] },
        failure: { text: 'THEY GRAB A PACK AS YOU FLEE.', outcomes: [{ kind: 'loseItem' }] },
      },
    ],
  },
  {
    id: 'cursedTotem',
    act: 1,
    title: 'THE CURSED TOTEM',
    art: 'totem',
    text: 'A CARVED TOTEM WHISPERS AS YOU PASS. THE WHISPERS FOLLOW YOU.',
    choices: [
      {
        label: 'SMASH IT',
        check: { stat: 'attack', mode: 'highest', difficulty: 36 },
        success: { text: 'IT SPLITS IN TWO. THE WHISPERS STOP.', outcomes: [] },
        failure: { text: 'SPIRITS POUR OUT OF THE CRACKS!', outcomes: [{ kind: 'fight', enemies: ['wisp', 'wisp', 'wisp'] }] } },
      { label: 'APPEASE IT (60 GOLD)', cost: 60, success: { text: 'THE WHISPERS GO QUIET.', outcomes: [{ kind: 'gold', amount: -60 }] } },
      { label: 'IGNORE IT', success: { text: 'THE WHISPERS CLING TO YOU.', outcomes: [{ kind: 'cursed', penalty: { attack: 6, magic: 6 } }] } },
    ],
  },
  // --- Act 3 events: two good, two bad.
  {
    id: 'lastSanctuary',
    act: 2,
    title: 'THE LAST SANCTUARY',
    art: 'sanctuary',
    text: 'A SMALL CHAPEL STANDS UNTOUCHED BY THE DARK. CANDLES STILL BURN ON ITS ALTAR.',
    choices: [
      {
        label: 'PRAY',
        check: { stat: 'magic', mode: 'highest', difficulty: 36 },
        success: { text: 'A GIFT FROM ON HIGH.', outcomes: [{ kind: 'skill', rarity: 'legendary' }] },
        failure: { text: 'THE ALTAR IS SILENT.', outcomes: [] },
      },
      { label: 'REST', success: { text: 'YOU SLEEP SAFELY FOR THE FIRST TIME IN DAYS.', outcomes: [{ kind: 'blessed', bonus: { attack: 8, magic: 8 } }, { kind: 'gold', amount: 80 }] } },
      { label: 'LEAVE', success: { text: 'THE CANDLES FLICKER AS YOU GO.', outcomes: [] } },
    ],
  },
  {
    id: 'fallenHerosTomb',
    act: 2,
    title: "THE FALLEN HERO'S TOMB",
    art: 'tomb',
    text: "A WARRIOR'S TOMB, HER ARMS LAID ACROSS THE LID. A PILE OF OFFERINGS GLINTS BESIDE IT.",
    choices: [
      {
        label: 'PAY RESPECTS',
        chance: 0.75,
        success: { text: 'THE LID SLIDES OPEN. SHE WANTS YOU TO HAVE THEM.', outcomes: [{ kind: 'item', rarity: 'legendary' }] },
        failure: { text: 'HER RESTLESS GUARDS RISE!', outcomes: [{ kind: 'fight', enemies: ['shade', 'shade', 'shade'] }] },
      },
      { label: 'TAKE THE OFFERINGS', success: { text: 'THE GOLD IS COLD IN YOUR HANDS.', outcomes: [{ kind: 'gold', amount: 150 }, { kind: 'cursed', penalty: { attack: 8, magic: 8 } }] } },
      { label: 'LEAVE', success: { text: 'YOU BOW AND MOVE ON.', outcomes: [] } },
    ],
  },
  {
    id: 'bloodPact',
    act: 2,
    title: 'THE BLOOD PACT',
    art: 'pact',
    text: 'A VAMPIRE NOBLE BARS THE WAY, SMILING. "A GIFT, FOR A TASTE."',
    choices: [
      { label: 'ACCEPT', success: { text: 'THE GIFT IS REAL. SO IS THE BITE.', outcomes: [{ kind: 'item', rarity: 'epic' }, { kind: 'wounded' }, { kind: 'cursed', penalty: { attack: 8, magic: 8 } }] } },
      {
        label: 'REFUSE',
        check: { stat: 'attack', mode: 'highest', difficulty: 44 },
        success: { text: 'HE STEPS ASIDE, AMUSED.', outcomes: [] },
        failure: { text: 'HE CALLS HIS KIN.', outcomes: [{ kind: 'fight', enemies: ['vampire', 'vampire'] }] },
      },
      { label: 'BRIBE (150 GOLD)', cost: 150, success: { text: 'GOLD SPEAKS EVEN TO THE DEAD.', outcomes: [{ kind: 'gold', amount: -150 }] } },
    ],
  },
  {
    id: 'plaguePit',
    act: 2,
    title: 'THE PLAGUE PIT',
    art: 'plague',
    text: 'THE ONLY PATH RUNS THROUGH A PIT OF ROT. SOMETHING BLOATED STIRS IN THE MUCK.',
    choices: [
      { label: 'WADE THROUGH', success: { text: 'YOU EMERGE SICK, BUT WITH A DEAD MAN\'S PURSE.', outcomes: [{ kind: 'wounded' }, { kind: 'gold', amount: 80 }] } },
      {
        label: 'BURN IT',
        check: { stat: 'magic', mode: 'highest', difficulty: 44 },
        success: { text: 'THE PIT GOES UP IN FLAMES.', outcomes: [] },
        failure: { text: 'THE FIRE WAKES WHAT LIVES THERE!', outcomes: [{ kind: 'fight', enemies: ['abomination', 'abomination'] }] },
      },
      {
        label: 'GO AROUND',
        chance: 0.5,
        success: { text: 'A LONG WAY, BUT A SAFE ONE.', outcomes: [] },
        failure: { text: 'YOU LOSE A PACK IN THE MUD.', outcomes: [{ kind: 'loseItem' }] },
      },
    ],
  },
];
