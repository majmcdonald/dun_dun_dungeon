import { Assets } from './engine/assets';
import { Input } from './engine/input';
import { startLoop } from './engine/loop';
import { Renderer } from './engine/renderer';
import { SceneManager, type GameContext } from './engine/scene';
import { CLASSES_BY_ID } from './content/classes';
import { EVENT_LIBRARY } from './content/events';
import { ITEMS_BY_ID } from './content/items';
import { createState } from './game/state';
import { enterNode } from './run/flow';
import { startRun } from './run/run';
import { DebugScene } from './scenes/DebugScene';
import { RunEndScene } from './scenes/RunEndScene';
import { TitleScene } from './scenes/TitleScene';
import { VfxPreviewScene } from './scenes/VfxPreviewScene';

const canvas = document.getElementById('game') as HTMLCanvasElement;

const game: GameContext = {
  renderer: new Renderer(canvas),
  input: new Input(canvas),
  assets: new Assets(),
  scenes: new SceneManager(),
  state: createState(),
};

const params = new URLSearchParams(location.search);

// Dev-only: ?preview=vfx loops the battle VFX; ?preview=victory or ?preview=defeat shows the run-end screen.
const preview = params.get('preview');
if (preview === 'event') {
  // A run sitting just before an Event room; &id= picks the event (the first one by default).
  const state = game.state;
  startRun(state, 0, ['knight', 'mage', 'cleric'].map((id) => CLASSES_BY_ID[id]), 7);
  const run = state.run!;
  const node = run.map.floors.flat().find((n) => n.type === 'event')!;
  run.position = run.map.floors.flat().find((n) => n.next.includes(node.id))?.id ?? null;
  run.gold = 100;
  run.event = { node: node.id, id: params.get('id') ?? EVENT_LIBRARY[0].id, result: null };
  enterNode(game, node);
} else if (preview === 'store') {
  // A run sitting just before a Store room, with gold, worn and spare gear, and two broken pieces.
  const state = game.state;
  startRun(state, 0, ['knight', 'mage', 'cleric'].map((id) => CLASSES_BY_ID[id]), 7);
  const run = state.run!;
  const store = run.map.floors.flat().find((n) => n.type === 'store')!;
  const parent = run.map.floors.flat().find((n) => n.next.includes(store.id));
  run.position = parent?.id ?? null;
  run.gold = 300;
  run.broken = ['scaleMail', 'leatherCap'];
  state.inventory.items.push(ITEMS_BY_ID.longsword, ITEMS_BY_ID.clothRobe);
  state.party[0].equipment = { armor: ITEMS_BY_ID.chainmail };
  enterNode(game, store);
} else if (preview === 'vfx') {
  game.scenes.switchTo(new VfxPreviewScene(game));
} else if (preview === 'victory' || preview === 'defeat') {
  const won = preview === 'victory';
  game.scenes.switchTo(
    new RunEndScene(game, {
      won,
      level: won ? 3 : 2,
      where: won ? 'THE BOSS' : 'ROOM 7',
      party: ['knight', 'barbarian', 'cleric'],
      slayers: won ? [] : ['SLIME', 'ORC', 'BAT', 'ARCHER', 'SHAMAN'],
      stats: won
        ? { rooms: 48, fights: 31, epics: 6, bosses: 3, goldEarned: 1284, damageDone: 48210, damageTaken: 21377 }
        : { rooms: 22, fights: 14, epics: 2, bosses: 1, goldEarned: 517, damageDone: 15944, damageTaken: 13602 },
    }),
  );
  // Dev-only: ?debug opens the debug screen directly.
} else game.scenes.switchTo(params.has('debug') ? new DebugScene(game) : new TitleScene(game));

startLoop({
  update: (dt) => game.scenes.update(dt),
  render: () => game.scenes.render(game.renderer.ctx),
});
