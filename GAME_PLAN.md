# Autobattler Game — Design & Development Plan

Status: Phase 2 complete. Phase 3 next.

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
| Scope | MVP = 3 levels, each ending in a boss |

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
- Summons: a second party column in front of the party (up to 3), scaled from the summoner's stats, lasting until killed; front-targeting attacks hit summons first. Ranger beasts, Druid animals, Necromancer undead, and the Warlock familiar use it.
- Work order: engine systems + tests → content in batches of 4 classes (reviewed on the codex page) → art for summons, the transform critter, meters, and new VFX → then the roster picker and loadout UI.

Progress: engine features, balance formulas, 60 items, and all 12 class sprites approved. Archetype expansion approved: 400 skills (30 per class, ~75 synergies), 9 summon creatures, and the Rage/Souls/Chi/Familiar mechanics, all engine-tested. Remaining: summon/critter sprites, meter and status UI, summon column on the battle screen, then the roster picker and loadout/inventory UI. Until the picker exists, the main game starts with an empty party.

**Phase 4 — Map & Run Structure**
Branching map generator, node types, full-map visibility, run save/resume, post-battle reward flow (heal/skill draft/equipment draft/gold). Art: map screen, node icons, reward screen.

**Phase 5 — Shops & Events**
Randomized-refresh shop (buy/sell), text-choice event system with stat-based outcomes. Art: shop screen, event screen.

**Phase 6 — Content: 3 Levels**
Populate each level's enemies/elites/boss, event pool, shop weighting, difficulty curve, and which milestone unlocks which roster character. Balancing pass 2: enemy stats, group sizes, elite/boss curve, gold and drop rates. Art: level backgrounds, boss sprites, level-specific enemies.

**Phase 7 — Audio**
SFX (hits, skill activation, UI, victory/defeat) and music (map/battle/boss) across everything built so far.

**Phase 8 — Polish & Balance**
Balancing pass 3: full-run playtesting, fixing outliers, dominant builds, and dead choices; bug fixing.
