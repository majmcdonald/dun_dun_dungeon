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
