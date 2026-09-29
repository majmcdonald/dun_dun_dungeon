import type { GameState } from '../game/state';
import type { Assets } from './assets';
import type { Input } from './input';
import type { Renderer } from './renderer';

export interface GameContext {
  renderer: Renderer;
  input: Input;
  assets: Assets;
  scenes: SceneManager;
  state: GameState;
}

export interface Scene {
  enter?(): void;
  exit?(): void;
  update(dt: number): void;
  render(ctx: CanvasRenderingContext2D): void;
}

export class SceneManager {
  private current: Scene | null = null;

  switchTo(scene: Scene): void {
    this.current?.exit?.();
    this.current = scene;
    scene.enter?.();
  }

  update(dt: number): void {
    this.current?.update(dt);
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.current?.render(ctx);
  }
}
