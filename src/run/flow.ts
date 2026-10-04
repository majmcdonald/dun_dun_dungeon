import { ITEM_LIBRARY } from '../content/items';
import { SKILL_LIBRARY } from '../content/skills';
import { clearSlot } from '../engine/save';
import type { GameContext } from '../engine/scene';
import { EVENT_LIBRARY } from '../content/events';
import { EventScene } from '../scenes/EventScene';
import { MapScene } from '../scenes/MapScene';
import { PartyScene } from '../scenes/PartyScene';
import { PreBattleScene } from '../scenes/PreBattleScene';
import { RewardScene } from '../scenes/RewardScene';
import { RunEndScene } from '../scenes/RunEndScene';
import { StoreScene } from '../scenes/StoreScene';
import { pickEncounter } from './encounters';
import { openEvent } from './events';
import { openStore } from './store';
import type { MapNode } from './map';
import { noteRoom, noteRunEnd, saveProfile } from './profile';
import { rollReward } from './rewards';
import { beginNode, clearNode, pendingNodeOf, recordWin, roomType, runSummary, saveRun, setRewardPicks } from './run';

// Moves the run between screens: map → node → (fight) → reward → party → map. Every step is autosaved.
// The run rules themselves live in run.ts.

export function enterNode(game: GameContext, node: MapNode): void {
  const run = game.state.run;
  if (!run) return;
  beginNode(run, node);
  switch (roomType(run, node)) {
    case 'battle':
    case 'epic':
    case 'boss':
      pickEncounter(game.state, node);
      return game.scenes.switchTo(new PreBattleScene(game));
    case 'event':
      openEvent(game.state, node, EVENT_LIBRARY);
      return game.scenes.switchTo(new EventScene(game));
    case 'store':
      openStore(game.state, node);
      return game.scenes.switchTo(new StoreScene(game));
    case 'treasure':
      return winNode(game);
  }
}

export function pendingNode(game: GameContext): MapNode | null {
  return game.state.run ? pendingNodeOf(game.state.run) : null;
}

// A won fight or an opened treasure; `battleGold` is gold won by Gold skills during the fight.
// A "?" room pays as what it turned out to be; fights started by an event pay out like an Epic Monster.
export function winNode(game: GameContext, battleGold = 0): void {
  const run = game.state.run;
  const node = pendingNode(game);
  if (!run || !node) return;
  const type = roomType(run, node);
  const payAs = type === 'event' ? 'epic' : type;
  if (game.state.profile) noteRoom(game.state.profile, type, run.level);
  recordWin(run, { ...node, type }, rollReward(payAs, game.state.party, SKILL_LIBRARY, ITEM_LIBRARY, Math.random, battleGold));
  saveRun(game.state);
  if (run.result === 'won') return endRun(game);
  game.scenes.switchTo(new RewardScene(game));
}

// Nodes with nothing to win: leaving a Store, or finishing an event without a fight.
export function completeNode(game: GameContext): void {
  const run = game.state.run;
  const node = pendingNode(game);
  if (!run || !node) return;
  const type = roomType(run, node);
  if (game.state.profile && type === 'event') noteRoom(game.state.profile, type, run.level);
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
  const summary = runSummary(game.state, slayers);
  const profile = game.state.profile;
  if (profile) {
    noteRunEnd(profile, summary.won, summary.party, run.level, summary.room);
    summary.unlocked = profile.newUnlocks.splice(0);
    saveProfile(run.slot, profile);
  }
  clearSlot(run.slot);
  game.state.run = null;
  game.scenes.switchTo(new RunEndScene(game, summary));
}
