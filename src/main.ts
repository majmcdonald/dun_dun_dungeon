import { Assets } from './engine/assets';
import { Input } from './engine/input';
import { startLoop } from './engine/loop';
import { Renderer } from './engine/renderer';
import { SceneManager, type GameContext } from './engine/scene';
import { BattleScene } from './scenes/BattleScene';

const canvas = document.getElementById('game') as HTMLCanvasElement;

const game: GameContext = {
  renderer: new Renderer(canvas),
  input: new Input(canvas),
  assets: new Assets(),
  scenes: new SceneManager(),
};

game.scenes.switchTo(new BattleScene(game));

startLoop({
  update: (dt) => game.scenes.update(dt),
  render: () => game.scenes.render(game.renderer.ctx),
});
