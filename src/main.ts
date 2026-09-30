import { Assets } from './engine/assets';
import { Input } from './engine/input';
import { startLoop } from './engine/loop';
import { Renderer } from './engine/renderer';
import { SceneManager, type GameContext } from './engine/scene';
import { demoParty } from './content/testing';
import { createState } from './game/state';
import { PreBattleScene } from './scenes/PreBattleScene';

const canvas = document.getElementById('game') as HTMLCanvasElement;

const game: GameContext = {
  renderer: new Renderer(canvas),
  input: new Input(canvas),
  assets: new Assets(),
  scenes: new SceneManager(),
  state: createState(),
};

const demo = new URLSearchParams(location.search).get('party');
if (demo) game.state.party = demoParty(demo);

game.scenes.switchTo(new PreBattleScene(game));

startLoop({
  update: (dt) => game.scenes.update(dt),
  render: () => game.scenes.render(game.renderer.ctx),
});
