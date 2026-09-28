# Autobattler Game — Design & Development Plan

Status: Planning complete. Implementation not yet started.

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
| Art | Pixel art, low native resolution scaled up, Claude-generated, every screen/asset approved before final |
| Animation | One generic attack animation per sprite; powerful skills get distinct special VFX |
| Audio | In scope from the start (SFX + music) |
| Scope | MVP = 3 levels, each ending in a boss |

Open item: exact combat math (Attack vs. Defense formula, drop-rate weights) is not locked — resolved as a design pass inside Phase 1/2, not blocking this plan.

## Development Phases

**Phase 0 — Tech Foundation**
Project scaffold (TS build, canvas render loop, asset loader, input, localStorage save skeleton). No gameplay yet.
Exit: blank canvas renders, saves/loads a dummy state.

**Phase 1 — Vertical Slice: One Battle**
One hero (2–3 skills) vs. one enemy, full timer/targeting/damage/win-loss loop working end to end. Minimal real pixel art for this slice (1 hero sprite, 1 enemy sprite, background, HP/timer bars) — approved before moving on.
Exit: a single battle is fully playable and looks right before anything scales out.

**Phase 2 — Full Combat System**
Scale to 1–9 enemies, formation (front/back, reorder UI), targeting rules incl. taunt-style equipment effects, equipment-break-on-KO, VFX system for special skills. Art: enemy variety needed to test this phase.

**Phase 3 — Roster, Skills, Equipment**
All 10–15 characters (stats, starting skills, class tags), full skill library (shared/tag/class-unique) with synergy system, equipment system (5 slots, rarities, enchanted passives), inventory/swap UI. Art: portraits/sprites for full roster, equipment icons.

**Phase 4 — Map & Run Structure**
Branching map generator, node types, full-map visibility, run save/resume, post-battle reward flow (heal/skill draft/equipment draft/gold). Art: map screen, node icons, reward screen.

**Phase 5 — Shops & Events**
Randomized-refresh shop (buy/sell), text-choice event system with stat-based outcomes. Art: shop screen, event screen.

**Phase 6 — Content: 3 Levels**
Populate each level's enemies/elites/boss, event pool, shop weighting, difficulty curve, and which milestone unlocks which roster character. Art: level backgrounds, boss sprites, level-specific enemies.

**Phase 7 — Audio**
SFX (hits, skill activation, UI, victory/defeat) and music (map/battle/boss) across everything built so far.

**Phase 8 — Polish & Balance**
Full-run playtesting, damage-formula/economy tuning, bug fixing.
