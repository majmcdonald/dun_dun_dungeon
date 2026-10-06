# Autobattler Game — Design & Development Plan

Status: Phase 5 complete. Phase 6 in progress.

## Confirmed Decisions

| Area | Decision |
|---|---|
| Platform | Web browser, TypeScript, plain Canvas API (no framework) |
| Combat | Fully automatic autobattler — no player input mid-battle |
| Timers | 4 skill slots per character, independent parallel timers, fixed duration (no speed stat) |
| Targeting | Skill-defined per skill; some enemy skills target front position; equipment can alter targeting (taunt-style) |
| Formation | Front/back position affects targeting; freely reorderable between battles |
| Enemy count | Varies 1–9 per encounter; regular < elite < boss in difficulty/size |
| Enemy AI | Simplified (not full 4-slot system) |
| Stats | HP, Attack, Magic Power, Defense, Resistance |
| Roster | Fixed, 10–15 characters; pick 3 per run; more unlock via run milestones (not currency) |
| Starting loadout | Fixed default skills, no starting equipment |
| Skills/spells | Three tiers: shared/basic, tag-restricted, class-unique. Synergy bonus requires a specific co-equipped skill on the *same* character |
| Equipment | 5 slots (armor, helmet, boots, weapon, jewelry); rarity tiers Common/Rare/Epic/Legendary; enchanted = separate always-on passive (doesn't take a skill slot); sellable, skills are not |
| Inventory | Unlimited; swap only between battles |
| Map | Slay the Spire–style branching graph, fully visible upfront; node types: battle, epic monster (optional elite), store, event, treasure, boss; no rest sites |
| Post-battle reward | Full heal, choose 1 of 3 skills, choose 1 of 2 equipment, automatic gold |
| Shop | Randomized stock, refreshes each visit |
| Events | Text-choice vignettes, stat-based outcomes |
| Economy | Gold: tens–hundreds, one pool, persists whole run |
| Defeat | KO'd character randomly loses one worn equipment piece |
| Loss condition | All 3 characters defeated |
| Save | Mid-run state persists (resumable) |
| Art | Pixel art at 480x270 native, integer-scaled; 32x32 combatant sprites; code-authored (palette-indexed pixel grids in `src/art/sprites/`, rendered at runtime, reviewed on `preview.html` for approval); every screen/asset approved before final |
| Palette | Endesga 32 only |
| Font | Code-authored 5x7 pixel font, uppercase, drop shadow |
| Battle layout | 40px brick wall strip on top (battle clock); left sidebar with one card per party member (name, HP, barrier, 4 skill timers) aligned to that member's row; party in a column, position 1 on top; enemies in a 3x3 grid, column nearest the party is the front line; enemy HP + timer bars under each sprite |
| Damage formula | Percentage mitigation: damage = power × 100 / (100 + Defense or Resistance), minimum 1 |
| Timer start | Each skill's first activation is delayed by a random 0–200ms so identical units don't fire in lockstep |
| Floating numbers | One line per target: damage (red), absorbed (cyan, in parentheses), barrier gain (cyan); hits within 0.25s merge and pop to 2x size; rise 32px/s |
| Animation | One generic attack animation per sprite; powerful skills get distinct special VFX |
| Audio | In scope from the start (SFX + music) |
| Name | Dun-Dun-Dungeon |
| Scope | MVP = 3 levels, each ending in a boss |
| Debug screen | Kept in every phase from Phase 4 on: pick any party, give them any equipment and skills from the whole game, and start a fight |

Balancing is done in three passes: Phase 3 (stat budgets and skill power formulas), Phase 6 (encounter and economy tuning), Phase 8 (full-run tuning). Earlier phases only make test encounters winnable enough to exercise mechanics.

## Development Phases

**Phase 0 — Tech Foundation**
Project scaffold (TS build, canvas render loop, asset loader, input, localStorage save skeleton). No gameplay yet.
Exit: blank canvas renders, saves/loads a dummy state.

**Phase 1 — Vertical Slice: One Battle**
Knight (2–3 skills) vs. Slime, full timer/targeting/damage/win-loss loop working end to end. Minimal real pixel art for this slice (1 hero sprite, 1 enemy sprite, background, HP/timer bars) — approved before moving on.
Exit: a single battle is fully playable and looks right before anything scales out.
Done: Knight (Slash, Shield Bash, Iron Guard) and Slime (Bounce) sprites approved; battle screen approved at 3 Knights vs. 9 Slimes. Current stats are unbalanced (party loses) — deferred per the balancing plan.

**Phase 2 — Full Combat System**
Scale to 1–9 enemies, formation (front/back, reorder UI), targeting rules incl. taunt-style equipment effects, equipment-break-on-KO, VFX system for special skills. Art: enemy variety needed to test this phase. Test encounters only need to be winnable.

Phase 2 design:
- Abilities are tagged `skill` or `spell`. A spell that heals, buffs, or grants a barrier is a *defensive* spell.
- Targeting = side (enemy / ally / self) + selector + area.
  - Selectors: front, back (last position), random, lowest HP%, highest HP%, lowest total HP, highest total HP, enemy that last attacked the caster, enemy with most damage dealt, enemy that has cast a spell, enemy that has cast a defensive spell.
  - No valid target → fall back to the front unit of that side. Ties → front-most (lowest position).
  - Area (single / row / column / all) expands around the selected target. Enemy grid: row = same row, column = same column. Party side: row = that member only, column = whole party.
- Taunt (equipment): redirects every single-target attack from opponents to the taunter. Area attacks unaffected.
- New effects: heal (Magic Power), stat buff (flat, timed, refreshes rather than stacks). Barrier unchanged.
- Equipment core: 5 slots with stat bonuses and taunt flag; KO breaks one random worn piece; slot icons on party cards. Test gear hard-coded; inventory/rarity/enchantments in Phase 3.
- Screens: pre-battle screen shows the enemy types to be faced (types, not counts), party order, and equipped abilities with FIGHT and UPDATE PARTY. UPDATE PARTY opens the party screen (drag cards to reorder now; equipment/skill swap in Phase 3); leaving it starts the battle. Equipment icons show hover tooltips (slot, item, stat bonuses, special effects).
- Test content: party Knight (Taunt Helm), Mage (Fireball — area row around lowest total HP, VFX; Arcane Bolt — most damage), Cleric (Heal — lowest HP% ally, VFX; Blessing — +DEF all allies, VFX; Smite — cast defensive). Enemies: Slime (front), Bat (random), Archer (back), Orc (Cleave — column around highest total HP; Charge — highest HP%), Shaman (Mend — heal lowest HP% ally; Hex — cast a spell). Encounter: front Slime×3, mid Bat/Orc/Bat, back Archer/Shaman/Archer.

Done: engine targeting/areas/taunt/heal/buff/equipment-break with tests; Mage, Cleric, Bat, Archer, Orc, Shaman sprites approved (after an independent art review); Fireball/Heal/Blessing VFX, equipment icons with tooltips, pre-battle and party screens approved. Test encounter tuned only to be winnable while allowing KOs (Slime ATK 12, Bat ATK 9).

**Phase 3 — Roster, Skills, Equipment**
All 10–15 characters (stats, starting skills, class tags), full skill library (shared/tag/class-unique) with synergy system, equipment system (5 slots, rarities, enchanted passives), inventory/swap UI. Balancing pass 1: stat budgets per rarity, skill power per cooldown second, class HP/damage baselines. Art: portraits/sprites for full roster, equipment icons.

Phase 3 design:
- Roster: 12 classes; 6 available at start, 6 unlocked by run milestones (which milestone → Phase 6).
  - Starting: Knight (martial, heavy), Mage (caster, arcane), Cleric (caster, holy), Rogue (martial, shadow), Ranger (martial, ranged, nature), Barbarian (martial, heavy).
  - Unlockable: Paladin (martial, heavy, holy), Necromancer (caster, shadow), Druid (caster, nature), Monk (martial, holy), Bard (caster, arcane), Warlock (caster, shadow, arcane).
- Tags: martial, caster, heavy, ranged, holy, arcane, nature, shadow. Drive tag-restricted skills and gear.
- Gear restrictions by tag: heavy armor/helmets → heavy; staves, wands, tomes → caster; bows → ranged; swords, axes, maces → martial. Other gear is universal.
- Skills: three access tiers (shared, tag-restricted, class-unique) plus a fixed rarity per skill (Common–Legendary) that sets power and drop frequency. Once per character (a second copy may go on another character). Prerequisite skills cannot be equipped unless their prerequisite is in another slot on the same character; the prerequisite cannot be unequipped while its dependent is equipped. Synergy bonuses apply when a specific other skill is co-equipped on the same character.
- New effects: debuff (timed flat stat reduction, refreshes), multi-hit, drain (heal caster for % of damage), regen (heal over time), damage over time.
- Elements: fire, ice, lightning, holy, shadow, poison, carried optionally on top of physical/magic damage. Elemental resist/weakness applies after Defense/Resistance mitigation. Sources: Epic/Legendary gear enchantments and innate enemy traits.
- Equipment: distinct hand-authored items per rarity. Every Epic and Legendary item has one hand-authored enchantment: on-hit effects, reactive effects (thorns, on-hit-taken, ally-death), targeting/taunt effects, or elemental resistance. Common/Rare have stats only. Items use their slot icon with a rarity-colored border.
- Scope: ~100 skills and ~60 items.
- UI: each party-screen card gets an EDIT button opening that character's loadout (gear and skills plus inventory); dragging elsewhere on the card still reorders.
- Process: content (classes, skills, items) is reviewed on a published reference page before it's final. Testing uses a simple choose-3 roster picker at launch (restyled in Phase 4) and an inventory holding one copy of every skill and item.
- Work order: engine features + tests → balance formulas → content + reference page → 9 new sprites → loadout/inventory UI and roster picker.
- Balancing pass 1 (approved), enforced by a budget-check test over all content:
  - Skill budget per second of cooldown, by rarity (Common / Rare / Epic / Legendary): damage 0.75 / 0.90 / 1.05 / 1.25 × stat; heal 0.50 / 0.60 / 0.70 / 0.85 × MAG; barrier 0.60 / 0.72 / 0.84 / 1.00 × stat; buff/debuff 6 / 8 / 10 / 13 points (amount × duration ÷ cooldown).
  - Per-target area factor: row/column ×0.5, all ×0.35. DoT and regen totals may reach ×1.1 (delayed). Drain costs 25% of the damage budget. Legendary skills with a prerequisite get +15%. Synergy bonuses are +25–40% on top. Multi-effect skills split one budget across their effects.
  - Class baselines before gear (HP / ATK / MAG / DEF / RES): Tank 150/14/0/22/12 (Knight, Paladin); Bruiser 125/18/0/14/8 (Barbarian, Monk); Striker 95/18/0/8/8 (Rogue, Ranger); Caster 85/4/18/6/15 (Mage, Necromancer, Warlock); Support 95/6/14/8/15 (Cleric, Druid, Bard).
  - Gear budget in points (1 ATK/MAG/DEF/RES = 1, 4 HP = 1): Common 8, Rare 14, Epic 20 + enchantment, Legendary 28 + enchantment.
- Art template (from the second art review): hand-authored row by row; 7-wide head in profile with the eye 2 columns from the face edge; 10px shoulders narrowing to an 8px waist; 2px legs with knee highlights; robes flare 8→14px with folds, a widening shadow, and a trim hem; 4-step shading per material lit from the top-left; held items drawn once and only moved, tilted, or rotated in the attack frame.

Phase 3 expansion (class archetypes):
- ~30 class-unique skills per class (~360 total), themed per class. Players mix and match freely; themes are archetypes, not subclasses. Duplicates may be owned in inventory, but a character still equips a skill once.
- Themes: Knight (sacrifice, guard, honor); Mage (chaos, ice, transformation); Cleric (light, order, life); Rogue (swashbuckler, assassin, thief); Ranger (beast master, hunter, pathfinder); Paladin (devotion, vengeance, glory); Barbarian (berserker, zealot, storm); Necromancer (raise, fear, death); Druid (shapeshift, summon, fauna); Monk (open hand, true self, soul); Bard (pace, inspiration, spirit); Warlock (link life, siphon, sacrifice).
- Class mechanics:
  - Rage (Barbarian): +1 per 1% of max HP lost (hits and self-damage), max 100 → Frenzy: his timers ×2 for 5s, then rage resets. Storm skills only work during Frenzy.
  - Souls (Necromancer): +1 whenever any unit dies (either side), max 5; soul spells spend 1–3.
  - Chi (Monk): +10 per hit he lands, max 100; his damage ×0.8 while filling. Full → Chi Burst: damage ×1.8 for 5s, then resets. Soul skills add chi and hold during Burst; True Self skills heal only during Burst.
  - Familiar (Warlock): 5s channel to summon it at the start of every battle and to resummon it after it dies; his timers pause while channeling.
- New skill rules:
  - Event skills: the timer advances only on its event. Honor (Knight is hit) and Vengeance (an ally is hurt) gain 1s per event; Life runs while the party's total HP is below 35%; Sacrifice fires once, instantly, when the Knight falls.
  - Conditional skills (Storm, soul spells, Open Hand = only jewelry worn): the timer fills and waits until the condition holds, then fires.
  - Glory: power grows 5% per 5 seconds of fight.
- New effects: slow/haste (timed timer-speed factors, e.g. 0.7× / 1.5×, refresh not stack; no permanent speed stat); transform (enemy → harmless critter: skills stop, +25% damage taken; ally → empowered form with bonus stats); steal a buff; drain a stat; bonus battle gold; short skill-based taunt; fear (push enemy timers back); chaos (random effect from a list); shapeshift (Druid's other skills pause, damage sharply up); zealot damage (bonus vs enemies that cast spells, reduced vs others); self-damage.
- Summons: a second party column in front of the party; each character has up to 2 active summons, standing in front of them in the same row (the first in the front-most column; when both are up, a new summon replaces the oldest). Scaled from the summoner's stats, lasting until killed; front-targeting attacks hit summons first. Ranger beasts, Druid animals, Necromancer undead, and the Warlock familiar use it.
- Work order: engine systems + tests → content in batches of 4 classes (reviewed on the codex page) → art for summons, the transform critter, and meters → then the roster picker and loadout UI. New VFX for the expansion effects moved to Phase 4.

Progress: Phase 3 complete. Approved and built: 12 classes, 400 skills (69 synergies, 36 prerequisites), 60 items, the Rage/Souls/Chi/Familiar mechanics, 9 summon creatures plus the transform critter, the battle screen's summon columns (2 per character), meters and status icons, the roster picker, and the loadout screen (search, sort, gear stat preview, rarity-bordered item icons). Dev tools at the time: party.html and ?party= demo parties (replaced by the Phase 4 debug screen).

**Phase 4 — Map & Run Structure**
Branching map generator, node types, full-map visibility, run save/resume, post-battle reward flow (heal/skill draft/equipment draft/gold). Art: map screen, node icons, reward screen, and VFX for the Phase 3 expansion effects (summon, transform, shapeshift, slow/haste, damage over time, chaos).

Phase 4 design:
- Map: per level, 15 floors on a Slay the Spire–style grid (7 columns, 6 paths drawn bottom to top that may merge), then a boss node. The whole map is visible from the start; the player picks one connected node per floor.
- Node mix: Battle ~50%, Epic Monster ~15%, Event ~25%, Store ~10%. Room 1 is always Battle; room 7 is always Treasure on every path, and Treasure appears nowhere else. The player-facing name for a floor is "room".
- Store and Event nodes are "coming soon" placeholders that simply continue the run until Phase 5.
- Name: Dun-Dun-Dungeon. Title screen (approved): game name on the wall, 3 save slots (NEW RUN, or CONTINUE with DELETE + confirm), DEBUG button.
- Map screen (approved): floors left to right so the whole map fits; reachable rooms bob with a frame; walked path gold, open paths white, others black dots; hover shows the room type.
- Encounters: every Battle, Epic Monster, and Boss node uses one of each enemy (Slime, Orc, Bat front; Archer, Shaman behind) until Phase 6 content.
- After a won fight: full heal, then the reward screen: automatic gold (Battle 15–25, Epic 40–60, Boss 100, plus Gold skill bonuses); choose 1 of 3 skills (only skills at least one party member can use; Skip allowed); choose 1 of 2 items (only items someone in the party can wear). Rarity weights (Common / Rare / Epic / Legendary): skills and Battle items 80 / 14 / 5 / 1; Epic Monster and Treasure items 60 / 25 / 12 / 3; Boss items 0 / 50 / 35 / 15. Treasure nodes give a reward without a fight.
- Run flow: title screen (New Run / Continue / Debug) → roster picker → map → nodes → rewards. Beating the level 3 boss shows a victory screen; losing the whole party shows a Run Over screen.
- Reward screen (approved): gold is banked and the room cleared as soon as it is won; the screen shows the gold won, the run's total, and "party fully healed". Picks can be changed until the next room is entered: CONTINUE with a pick opens the party screen with a rarity-colored "NEW:" note and a BACK button to the picks; with no picks it returns to the map. The last cleared room on the map reopens the reward ("REVIEW REWARDS"). Switching away from a pick that is equipped asks first (it will be unequipped); unchanged picks never move. Cards warn when the party already owns a copy ("ALREADY OWNED: EQUIPPED ON ... / N IN INVENTORY").
- Run end (approved): Victory or Run Over screen with the party (silhouettes when fallen), where the run ended, the enemies that wiped the party ("SLAIN BY"), and stats: level reached, rooms cleared, fights won, Epic Monsters, bosses, gold earned, damage done, damage taken (full hits incl. absorbed; summons count as party). Dev previews: ?preview=victory and ?preview=defeat.
- Save: 3 save slots in localStorage, autosaved after every node.
- Debug screen (approved): Title → DEBUG or ?debug. Party panel: up to 3 characters (any class incl. locked, via a class picker), drag rows to reorder, EDIT opens the loadout with an unlimited inventory, REMOVE. Encounter panel: 3×3 grid; clicking a cell opens a full-screen, searchable, scrollable monster picker with a stats/skills detail panel; CLEAR empties the grid. FIGHT runs the battle and returns to the debug screen with the setup restored (gear broken in the fight comes back).
- Art for approval: title screen, map screen and node icons (battle, epic, event, store, treasure, boss), reward screen, run over and victory screens, then the 6 moved VFX.
- VFX (approved): summon (spiral in + flash; the creature appears when it ends), transform (smoke poof; the critter appears when it ends), shapeshift (spiraling leaves), slow (sinking drops + tightening ring), haste (speed lines), chaos (multicolor burst), and damage-over-time ticks in the element's colors at 3 tiers by tick size (under 5%, 5–25%, 25%+ of the target's max HP). Played from battle events; preview at ?preview=vfx.
- Work order: run engine (map generator, run state, rewards, save slots) + tests → title and save-slot screen → map screen → reward flow → run over/victory → debug screen → VFX.

Progress: Phase 4 complete. Built and approved: map generator and map screen, title screen with 3 autosaved slots, reward flow with editable picks, victory and Run Over screens with run stats, debug screen with monster picker, and the 6 expansion VFX. Boss → next level, final boss → victory, and party wipe → Run Over were verified in the browser. Open item: unit tests for the screen flow (src/run/flow.ts).

**Phase 5 — Shops & Events**
Randomized-refresh shop (buy/sell), text-choice event system with stat-based outcomes. Art: shop screen, event screen.

Phase 5 design:
- Store stock per visit: 4 skills + 2 items, rolled with the same rules as fight rewards (only things the party can use; skills 80 / 14 / 5 / 1, items 60 / 25 / 12 / 3). Each Store node has its own stock; no rerolls.
- Prices by rarity: items Common 30 / Rare 60 / Epic 120 / Legendary 220 gold; skills 20% cheaper. Selling equipment pays 50% of its price; skills can't be sold.
- Repair: gear broken on a KO this run is remembered; the store can restore one piece to the inventory for 50% of its price.
- Store art: a 32×32 shopkeeper sprite beside the stock, with a counter graphic.
- Store (approved): SKILLS row (4) and ITEMS row (2) as cards with price; click a card, then BUY in the detail panel. Services: SELL GEAR (unequipped only; half price, enchanted gear +20%), REPAIR (one broken piece per visit, half price), ENCHANT (any gear once: one random stat +5, or +20 HP; 50 G +25 per rarity step; labelled ENCHANTED). Shopkeeper in a red fez behind a counter. Every transaction saves; LEAVE clears the room, and the store can be revisited from the map until the next room is entered. Preview: ?preview=store.
- "?" rooms (Event nodes) roll on entry, seeded per room: event 70%, monsters 15% (a normal Battle of the room's group), store 10%, treasure 5%. The map shows them as UNKNOWN.
- Events: 15+ text events now (Phase 6 adds level-specific ones). Each has 2–3 choices; a choice may test one party stat (e.g. highest ATK, total DEF) with a success chance that rises with it, shown as a %, clamped to 10–95%.
- Event outcomes: gain or lose gold; gain a skill or item; lose a random item; the next fight starts "wounded" (–25% HP) or "blessed" (bonus stats); start a fight (a win gives a bonus reward).
- Event screen art: a parchment panel with a 64×64 pixel illustration per event, the story text, and 2–3 choice buttons showing the tested stat and %.
- Event engine and screen (approved): checks read the party's BEST single value or PARTY total (gear included); 50% at the difficulty, scaling with the stat, clamped 10–95%. Outcomes: gold ±, a random usable skill/item (optionally of a set rarity), lose a random piece of gear, wounded (next fight at 75% HP), blessed (+stats next fight), or a fight (listed enemies or the map encounter; a win pays like an Epic Monster). The event per room is seeded and each appears once per run until all are seen; the choice and result save immediately. Preview: ?preview=event&id=<event id>.
- Events (approved): 16 events (shrine, locked chest, wandering merchant, rope bridge, goblin toll, clear spring, pinned adventurer, golden idol, bones and dice, dusty library, old battlefield, sleeping orc, humming portal, old mentor, bat cloud, ghost smith) in src/content/events.ts. Choices may roll on luck instead of a stat; paid choices need the gold (greyed out "NEED N G" otherwise). The screen shows what is tested and PASS/FAIL odds, never the outcomes.
- Work order: screen-flow tests (Phase 4 open item) → store engine + tests → store screen and shopkeeper → event engine (checks, outcomes, wounded/blessed, event fights) + tests → event screen → event texts (reviewed as a list) → event illustrations in batches.

Progress: Phase 5 complete. Built and approved: store (buy, sell, repair, enchant, revisit), shopkeeper sprite, event engine and parchment event screen, 16 events with illustrations, and new rarity weights. Wounded fights and event-fight rewards were verified in the browser. Not yet played end to end: gear broken in a fight then repaired at a store (the repair rules are unit-tested).

**Phase 6 — Content: 3 Levels**
Populate each level's enemies/elites/boss, event pool, shop weighting, difficulty curve, and which milestone unlocks which roster character. Balancing pass 2: enemy stats, group sizes, elite/boss curve, gold and drop rates. Art: level backgrounds, boss sprites, level-specific enemies.

Phase 6 design:
- No level themes. Each level ("act") gets its own battle backdrop and a tinted map for variety only.
- Encounters: 12 hand-written Battle encounters per act, in three groups of 4 by room (1–5, 6–10, 11–15). A Battle room picks one of its group's 4 at random without repeating within the run (if a group runs out, the least recently used repeats). Designed one group at a time; each group's monsters, abilities, and art are reviewed before the next.
- Difficulty: each act's enemies are simply stronger; no per-room scaling.
- Epic Monsters: 3 per act, separate from the Battle encounters. No repeats within a run until all 3 of the act have been met; then all 3 become available again.
- Monsters: each group adds new monsters and encounters get steadily harder through the act. Every group of 4 follows this mix:
  - 1 fight of mostly or all returning monsters, in larger numbers to reach the group's difficulty (their stats never rise);
  - 1 fight of a single returning monster type plus new monster(s);
  - 2 fights of only new monsters.
- Act 1, Group 1 (rooms 1–5, approved): Slime Puddle (Slime ×3 front); Rat Pack (Rat ×2 front, ×2 middle); Bone Sentries (Slime front, Archer ×2 back); Spore Patch (Mushroom ×2 front, Bat ×2 middle). New: Rat (22/7/0/2/2; Nibble 80% ATK front every 1.0s; fire weak) and Mushroom (45/4/6/3/8; Spore Puff poison over time on a random hero every 4s; fire weak, resists poison).
- Act 1, Group 2 (rooms 6–10, approved): Vermin Horde (Slime ×3 front, Rat ×3 middle, Mushroom ×2 back); Goblin Gang (Goblin ×3 front, Archer ×2 back); Haunted Webs (Spider ×2 front, Ghost ×2 middle); Goblin Den (Goblin ×2 front, Spider middle, Ghost back). New: Goblin (40/11/0/6/4; Stab 100% ATK front every 1.4s; Dirty Trick −3 DEF on the front hero 4s every 6s; lightning weak), Ghost (45/0/10/20/4; Wail 70% MAG shadow to a hero row every 4s; holy weak, resists shadow and poison), Spider (35/9/0/5/5; Bite 90% ATK front every 1.3s; Web slows a random hero to 70% for 3s every 5s; fire weak, resists poison).
- Act 1, Group 3 (rooms 11–15, approved): Goblin Warband (Goblin ×3 front; Spider ×2 + Shaman middle; Ghost ×2 + Archer back); Grave Watch (Skeleton Knight ×2 front, Archer ×3 back); Dark Ritual (Ghoul ×2 front, Skeleton Knight middle, Cultist ×2 back); Feeding Pit (Ghoul ×3 front, Cultist middle). New: Skeleton Knight (80/14/0/18/6; Slash 100% ATK front every 1.8s; Shield Wall taunts 3s every 8s; holy weak, resists poison), Ghoul (60/13/0/8/6; Rend 90% ATK front, heals for half the damage, every 1.6s; holy and fire weak, resists shadow and poison), Cultist (50/2/14/5/12; Dark Bolt 110% MAG shadow to the healthiest hero by % every 2.5s; Blood Rite +4 MAG to all enemies 6s every 8s; holy weak, resists shadow).
- Act 1 Epic Monsters (approved): Ogre Brute (Goblin ×2 front, Ogre middle; Ogre 260/20/0/14/6, Smash 120% ATK to a hero column every 4s, Stomp pushes all hero timers back 1.5s every 10s, lightning weak); Spider Queen (Spider ×2 front, Queen middle; Queen 200/12/8/10/10, Venom Spray poison over time on all heroes 35% ATK/s for 4s every 7s, Web Volley slows all heroes to 75% for 3s every 9s, Fangs 100% ATK front every 1.5s, fire weak, resists poison); Bone Mage (Skeleton Knight front, Bone Mage middle, Archer ×2 back; Bone Mage 170/4/18/8/18, Soul Drain 120% MAG shadow to the healthiest hero healing half every 3s, Bone Shield barrier on all allies every 8s, holy weak, resists shadow and poison). Sprites go straight to the art reviewer.
- Bosses: 3 possible bosses per act, one picked at random per run; options for each discussed when we reach them.
- Events: 4 act-specific events per act (12 new, with illustrations) alongside the 16 shared ones.
- Stores: the same stock rules on every act.
- Class unlocks (saved once for the whole game, shared by all slots; locked classes show their condition on the roster): Paladin — beat the act 1 boss; Necromancer — beat the act 2 boss; Warlock — win a run; Monk — defeat 10 Epic Monsters (across runs); Bard — hold 500 gold at once; Druid — complete 15 events (across runs).
- Balancing pass 2: automated fight simulations for parties typical at each point of a run, then a playtest. Act 1 targets (approved): Group 1 100% win, ~15s, ~25% party HP lost; Group 2 90%, ~20s, ~35% HP lost; Group 3 90%, ~25s, ~45%; Epic Monsters ~70%, ~30s, ~55%, often 1 KO; Boss ~60%, ~40s, ~60%, often 1 KO. First simulation (before tuning): every Act 1 fight won ~100% in 5–10s — monsters' HP and damage are far too low. Balance once Act 1's bosses exist, so the whole act is tuned together.
- Act 1 bosses (approved; one picked at random per run; 48×48 sprites): Goblin King (with 2 Goblins in front; 420/18/0/14/10; Scepter Bash 110% ATK front every 2s; Call the Horde summons 2 Goblins into empty cells every 10s, at most 6 on the field; War Cry all enemy timers ×1.4 for 4s every 12s; lightning weak), Slime King (alone; 600/16/0/8/8; Body Slam 120% ATK to the front column every 3.5s; Acid Spit poison over time on a random hero every 5s; Split: 2 Slimes at 66% and 33% HP; Burst: 3 Slimes on death; fire weak, resists poison), Troll (alone; 700/22/0/16/8; Club 120% ATK front every 2.5s; Regenerate ~2% max HP/s, stopped for 4s by fire or poison damage; Enrage at 50% HP: +6 ATK and timers ×1.5 for the rest of the fight; fire weak). Engine additions: enemy summons into empty cells (capped), HP-threshold triggers, on-death abilities for enemies, element-blocked regeneration, 48×48 sprites in battle.
- Act 1 boss sprites approved (48×48, drawn by the art reviewer); bosses replace the stand-in.
- Runs are the full 3 acts (LEVELS = 3); beating an Act 3 boss wins the run.
- Skill slots rework (approved, before the Act 1 balance pass):
  - Slot 1: the skill's timer runs ×1.25. Slot 2: normal. Slot 3: timer ×0.75. Slot 4: trigger skills only (and triggers can only go in slot 4), so each hero carries one trigger.
  - Triggers fire the moment their event happens, then wait out their cooldown before they can fire again.
  - Trigger events: start of battle, when hit, when an ally is hurt, when an ally falls, party HP below 35%, own HP below 50%, when you defeat an enemy, when any enemy dies, when healed, when your barrier breaks, when you cast a spell, on your own defeat.
  - The 27 existing trigger skills (Knight 13, Paladin 7, Cleric 6, Bard 1) become normal timed skills except the best 3 per class, which stay triggers.
  - New triggers: 10 shared (any class), 20 tag-restricted (Caster, Martial, etc.), and 3 per class (36). Nobody starts with a trigger.
  - Triggers get their own budget rule: power per activation scales with how rarely the event happens.
  - Recruits' 2 starting skills go in slots 1–2.
  - The loadout screen lets skills be dragged between slots to swap them.
  - Done: 10 shared, 20 tag, and 26 new class triggers (every class has exactly 3); 17 old triggers became timed skills. Library: 456 skills. "When an ally falls" counts heroes only (not summons).
- Act 2, Group 1 (rooms 1–5, approved): Graveyard Shift (Skeleton Knight ×3 front, Ghoul ×2 middle, Archer ×2 back); Orc Hunters (Orc ×2 front, Frost Wolf ×2 middle); Wolf Pack (Frost Wolf ×3 front, ×2 middle, Harpy back); Highwaymen (Bandit ×2 front, Bandit middle, Harpy ×2 back). New: Frost Wolf (Frost Bite: front hit plus extra ice damage every 1.0s; Howl: all enemies +ATK 4s every 8s; Frostbite Hide: when hit, slows the attacker to 70% for 3s, 3s cooldown; fire weak, resists ice), Harpy (Dive: hits the back hero every 2s; Screech: all hero timers back 1s every 9s; Take Flight: when hit, 70% less damage taken and 70% more dealt for 3s, 8s cooldown; lightning weak, resists poison), Bandit (Shiv: hits the lowest-HP hero and poisons them every 2.5s, +50% poison per Venom stack; Envenom: +1 permanent Venom stack every 5s; Caltrops: slows the front hero to 70% for 3s every 6s). Stats are set in the Act 2 balance pass.
- Act 2, Group 2 (rooms 6–10, approved): Bandit Camp (Bandit ×3 front, Orc ×2 middle, Archer ×2 back); Gnoll Raiders (Gnoll ×3 front, Frost Wolf ×2 middle); Quarry (Stone Golem ×2 front, Wisp ×2 back); Haunted Bog (Stone Golem front, Gnoll ×2 middle, Wisp ×2 back). New: Stone Golem (Slam: front column every 4s; Stone Skin: taunt and a large barrier every 10s; Shatter: on defeat, heavy damage to every hero; lightning weak, resists poison), Gnoll (Rend: front hit plus bleed every 1.8s; Bloodlust: whenever another enemy falls, +ATK and haste ×1.3 for 10s, each stack on its own timer; fire weak), Wisp (Flicker: fire hit on a random hero every 2s; Lure: healthiest hero's timers back 1.5s every 7s; Ember Ward: when hit, a barrier and a self-heal, 4s cooldown; Flame Wall: heavy fire damage to every hero every 10s; ice weak, resists fire). Engine: stacking buffs and haste.
- Act 2, Group 3 (rooms 11–15, approved): Gnoll Warband (Bandit ×2 front, Gnoll ×3 middle, Wisp ×2 back); Labyrinth (Minotaur ×2 front, Harpy ×2 back); Gorgon's Garden (Minotaur front, Medusa middle, Wyvern ×2 back); Wyvern Roost (Wyvern ×2 front, Wyvern middle, Medusa back). New: Minotaur (very high HP; Gore: healthiest hero every 2.5s; Trample: front column every 7s; Rampage below 50% HP: +ATK and haste for good; ice weak), Medusa (Petrifying Gaze: a random hero's timers back 3s every 8s; Serpent Hair: poison every 3s; Stone Glare: when hit, slows the attacker to 50% for 2s; holy weak, resists poison), Wyvern (flies; Tail Sting: front hit plus heavy poison every 4s; Bite: front hit, and every poison on the target ticks once more, every 3s; Take Flight like the Harpy; lightning weak, resists poison). Poisons from different casters stack.
- Act 2 Epic Monsters (approved): Frost Giant (Frost Wolf ×2 front; Glacial Smash, Blizzard, Ice Armor: stacking +DEF when hit), Chimera (Harpy ×2 back; every attack targets Caster-class heroes: Lion Bite, Goat Charge, Serpent Tail, Fire Breath), Hydra (Medusa back; Snapping Heads 3 hits, regenerates unless burned, Grow Head at 75/50/25% HP: stacking +ATK and haste).
- Act 2 bosses (approved, 48x48, boss fury): Bandit King (Bandit ×2 front; Twin Daggers with Venom-scaled poison, Smoke Bomb + enemy barriers, Call Thugs up to 4 Bandits, Envenom), Ice Queen (Frost Lance, Glacial Tomb, Mirror Shards when hit; below 50% HP the party slows to 60% for good and 2 Frost Wolves join), Elder Wyrm (Claw, Inferno, Take Flight, Molten Scales below 50% HP).
- Act 2 targets (approved, a big jump): Group 1 75% win, ~20s, ~40% HP lost; Group 2 70%, ~25s, ~50%; Group 3 65%, ~30s, ~55%; Epic Monsters ~55%, ~35s, ~65%, often 1 KO; Bosses ~45%, ~45s, ~70%, often 1 KO. Simulated Act 2 parties: Group 1 has full skill slots (common/rare) and 3 common/rare items each; Group 2 4 mostly rare items; Group 3 and Epics rare/epic skills and 5 rare/epic items; bosses the same plus 1 legendary across the party.
- Act 3, Group 1 (rooms 1–5, approved): Old Grudges (Gnoll, Minotaur, Gnoll front; Wisp, Medusa, Wisp back); The Nest (Bat ×3 front, Vampire middle, Bat ×3 back); Haunted Keep (Death Knight ×2 front, Shade ×2 back); Blood Court (Death Knight front, Vampire ×2 middle, Shade back). New: Vampire (Blood Drain: healthiest hero, heals half, every 2s; Mist Form: when hit, 50% less damage 3s, 8s cooldown; Bat Swarm at 50% HP: 3 Bats; holy and fire weak, resists shadow), Death Knight (Soul Reap: front column shadow hit every 3s; Unholy Aura: stacking +ATK for all enemies every 10s; Death Grip: when an ally falls, the healthiest hero's timers back 2s; holy weak, resists shadow and poison), Shade (Shadow Bolt every 2s; Drain Light: all heroes −MAG 6s every 9s; Fade: when hit, 80% less damage 2s, 6s cooldown; holy weak, resists shadow).
- Act 3, Group 2 (rooms 6–10, approved): Night Watch (Death Knight ×2 front, Vampire middle, Shade ×3 back); Bone Pit (Bone Golem ×2 front, Shade ×2 back); Cathedral Ruins (Gargoyle ×3 middle, Banshee back); Wailing Crypt (Bone Golem front, Gargoyle ×2 middle, Banshee ×2 back). New: Bone Golem (Bone Crush; Bone Spikes: when hit, damage back; Reassemble: rises once at 40% HP), Banshee (Wail: shadow damage and timers back 1s to all heroes; Keening: stacking −DEF on all heroes per fallen enemy), Gargoyle (Dive Claw on the back hero; Stone Form every 12s: 90% less damage for 4s but its timers stop).
- Act 3, Group 3 (rooms 11–15, approved): Legion of the Dead (Bone Golem, Death Knight, Bone Golem front; Banshee ×2 back); The Feast (Abomination ×2 front, Vampire ×2 back); Dark Mass (Abomination front, Nightmare middle, Dark Priest ×2 back); Nightmare Stampede (Nightmare ×3 middle, Dark Priest back). New: Abomination (Hook on the back hero; Rot Cloud: poison on all heroes; Burst: heavy poison on all heroes on defeat), Nightmare (Trample a row; Terror: timers back 2s and −ATK; Hellfire: fire over time on all heroes), Dark Priest (Raise Dead: Skeleton Knights, at most 2; Unholy Mending: heals the most-hurt enemy; Dark Ward: barrier on all enemies when one falls).
- Act 3 Epic Monsters (approved): Lich (Skeleton Knight ×2; Death Coil, Bone Prison, Chill of the Grave, Phylactery: reassembles at 50%), Bone Dragon (Gargoyle ×2; Bone Breath, Tail Sweep, Take Flight), Plague Lord (Abomination; Plague Bolt, Pestilence: every poison on every hero ticks once, Blighted Skin).
- Act 3 bosses (approved, 48x48, boss fury): Blood Countess (Vampire ×2; Crimson Feast, Blood Lance, Mist Form, Blood Moon at 50%: all enemies +ATK and haste, 4 Bats), The Reaper (Scythe, Mark of Death, Soul Harvest: heals and stacks +ATK when a hero falls, Final Hour at 25%), Demon Lord (Nightmare ×2; Infernal Cleave, Rain of Fire, Hellgate: Nightmares up to 3, Demonic Pact: reassembles at 40%).
- Act 3 targets (approved): Group 1 ~70%, Group 2 ~65%, Group 3 ~60%, Epic Monsters ~50%, Bosses ~40%; same testing rule as Act 2. Simulated Act 3 parties: rare/epic skills and 5 rare/epic items (Group 1), mostly epic items (Group 2), epic skills and items plus 1 legendary (Group 3, Epics), epic/legendary skills plus 2 legendaries (bosses). Balance pass done: 68/67/60/52/38%. Encounter changes: The Nest has 2 Vampires, Night Watch is Death Knight ×2 + Shade ×3, The Feast has 1 Vampire.
- Balance testing rule (approved): Act 1 is tuned for all 20 starting trios. Act 2 and later are tuned for trios from all 12 classes that include at least one support class (Cleric, Paladin, Druid, Bard); parties without one should expect to fall below the targets. Act 2 balance pass done on that basis.
- Support classes (approved): Cleanse (removes poison, bleed, burn) added to Purify, Divine Light, Holy Light, Beacon of Hope, Tranquility, Light Burst; the Paladin starts with Purifying Light (heal and cleanse all allies), the Druid's Rejuvenate and the Cleric's Renew regen all allies, the Bard's Inspire adds haste and regen; new shared common Antidote (cleanse + small heal).
- Class pass (approved, Act 2): Bard MAG 22, HP 120, DEF 10, ATK 10; Warlock MAG 28, HP 95; Necromancer MAG 22; Mage MAG 20; Ranger ATK 20; Knight HP 140, ATK 12; Cleric MAG 13. Every class lands 57–83% in Act 2 support trios.
- Run-level balance (approved, replaces the per-fight targets): with average gear and default targeting, about 90% of runs clear Act 1, 50% clear Act 2, and 25% win. Measured by a headless bot playing full runs (random path, best reward picks, store upgrades, best-odds event choices), trios with a support class. Result: 89% / 48% / 24% (starting-class trios 88% / 56% / 30%). Each act's regular monsters, Epic Monsters, and bosses were scaled separately to get there.
- Focus targeting (approved): clicking an enemy points every hero's and summon's front attacks at it; a gold outline marks the current target (the front enemy by default); when it dies, the target returns to the front. Taunt still takes priority. Enemy HP shows as a number under its bars.
- Skill identity rule (approved): shared skills stay plain (one effect); every class or tag skill carries a class hook (a rider effect, its element, or its mechanic). Retaliate was removed from the shared pool (counters are the Knight's identity); 36 class/tag skills gained hooks. Act 2 monster damage −4% to keep the run-level rates (87/47/23).
- Save slots are player profiles: each keeps its class unlocks and lifetime stats (runs, wins, best act and room, bosses, Epic Monsters, events, and runs/wins by class and by party) across runs; only DELETE clears it. The title screen shows the run in progress and a stats summary; STATS opens the full record. Unlocks are per profile, and the run-end screen announces new ones.
- Art: reviewed in batches of 4, as before.

**Phase 7 — Audio**
SFX (hits, skill activation, UI, victory/defeat) and music (map/battle/boss) across everything built so far.

**Phase 8 — Polish & Balance**
Balancing pass 3: full-run playtesting, fixing outliers, dominant builds, and dead choices; bug fixing.
