import { ITEM_LIBRARY } from '../content/items';
import { SKILL_LIBRARY } from '../content/skills';
import { clearSlot } from '../engine/save';
import type { GameContext } from '../engine/scene';
import { ComingSoonScene } from '../scenes/ComingSoonScene';
import { MapScene } from '../scenes/MapScene';
import { PartyScene } from '../scenes/PartyScene';
import { PreBattleScene } from '../scenes/PreBattleScene';
import { RewardScene } from '../scenes/RewardScene';
import { RunEndScene, type RunSummary } from '../scenes/RunEndScene';
import { findNode, FLOORS, type MapNode } from './map';
import { rollReward } from './rewards';
import { clearNode, LEVELS, saveRun, setRewardPicks } from './run';

// Moves the run between screens: map → node → (fight) → reward → party → map. Every step is autosaved.

export function enterNode(game: GameContext, node: MapNode): void {
  const run = game.state.run;
  if (!run) return;
  // Moving on locks in the previous reward's picks.
  run.lastReward = null;
  run.pending = node.id;
  switch (node.type) {
    case 'battle':
    case 'epic':
    case 'boss':
      return game.scenes.switchTo(new PreBattleScene(game));
    case 'event':
    case 'store':
      return game.scenes.switchTo(new ComingSoonScene(game, node.type));
    case 'treasure':
      return winNode(game);
  }
}

export function pendingNode(game: GameContext): MapNode | null {
  const run = game.state.run;
  if (!run?.pending) return null;
  return findNode(run.map, run.pending) ?? null;
}

// A won fight or an opened treasure: bank the gold (including any won by Gold skills), clear the node,
// and offer the skill/item picks. The last boss ends the run, so it skips the picks.
export function winNode(game: GameContext, battleGold = 0): void {
  const run = game.state.run;
  const node = pendingNode(game);
  if (!run || !node) return;
  const reward = rollReward(node.type, game.state.party, SKILL_LIBRARY, ITEM_LIBRARY, Math.random, battleGold);
  run.gold += reward.gold;
  run.stats.goldEarned += reward.gold;
  if (node.type !== 'treasure') run.stats.fights += 1;
  if (node.type === 'epic') run.stats.epics += 1;
  if (node.type === 'boss') run.stats.bosses += 1;
  const finalBoss = node.type === 'boss' && run.level + 1 >= LEVELS;
  clearNode(run, node.id);
  if (!finalBoss) {
    run.lastReward = {
      node: node.id,
      type: node.type,
      gold: reward.gold,
      skills: reward.skills.map((s) => s.id),
      items: reward.items.map((i) => i.id),
      skill: null,
      item: null,
    };
  }
  saveRun(game.state);
  if (run.result === 'won') return endRun(game);
  game.scenes.switchTo(new RewardScene(game));
}

// Nodes with nothing to win (the Store and Event placeholders).
export function completeNode(game: GameContext): void {
  const run = game.state.run;
  const node = pendingNode(game);
  if (!run || !node) return;
  clearNode(run, node.id);
  saveRun(game.state);
  game.scenes.switchTo(new MapScene(game));
}

// Takes the chosen picks; anything new is shown on the party screen, otherwise straight back to the map.
export function choosePicks(game: GameContext, skill: string | null, item: string | null): void {
  setRewardPicks(game.state, skill, item);
  saveRun(game.state);
  game.scenes.switchTo(skill || item ? new PartyScene(game) : new MapScene(game));
}

// Reopens the latest reward from the map: the party screen if something was taken, else the reward picks.
export function reviewReward(game: GameContext): void {
  const reward = game.state.run?.lastReward;
  if (!reward) return;
  game.scenes.switchTo(reward.skill || reward.item ? new PartyScene(game) : new RewardScene(game));
}

// `slayers`: the enemy types of the fight that wiped the party.
export function loseRun(game: GameContext, slayers: string[]): void {
  const run = game.state.run;
  if (!run) return;
  run.result = 'lost';
  endRun(game, slayers);
}

// A finished run frees its save slot and shows the victory or Run Over screen.
function endRun(game: GameContext, slayers: string[] = []): void {
  const run = game.state.run;
  if (!run) return;
  const at = pendingNode(game) ?? findNode(run.map, run.position ?? '');
  const summary: RunSummary = {
    won: run.result === 'won',
    level: run.level + 1,
    where: at?.type === 'boss' ? 'THE BOSS' : `ROOM ${at ? Math.min(at.floor + 1, FLOORS) : 1}`,
    party: game.state.party.map((m) => m.def.id),
    stats: { ...run.stats },
    slayers,
  };
  clearSlot(run.slot);
  game.state.run = null;
  game.scenes.switchTo(new RunEndScene(game, summary));
}
