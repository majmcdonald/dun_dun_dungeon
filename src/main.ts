import { Assets } from './engine/assets';
import { Input } from './engine/input';
import { startLoop } from './engine/loop';
import { Renderer } from './engine/renderer';
import { SceneManager, type GameContext } from './engine/scene';
import { createState } from './game/state';
import { DebugScene } from './scenes/DebugScene';
import { RunEndScene } from './scenes/RunEndScene';
import { TitleScene } from './scenes/TitleScene';

const canvas = document.getElementById('game') as HTMLCanvasElement;

const game: GameContext = {
  renderer: new Renderer(canvas),
  input: new Input(canvas),
  assets: new Assets(),
  scenes: new SceneManager(),
  state: createState(),
};

const params = new URLSearchParams(location.search);

// Dev-only: ?preview=victory or ?preview=defeat shows the run-end screen with sample stats.
const preview = params.get('preview');
if (preview === 'victory' || preview === 'defeat') {
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
