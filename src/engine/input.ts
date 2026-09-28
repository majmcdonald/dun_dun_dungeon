import { NATIVE_HEIGHT, NATIVE_WIDTH } from './renderer';

export interface PointerState {
  x: number;
  y: number;
  down: boolean;
}

export class Input {
  readonly pointer: PointerState = { x: 0, y: 0, down: false };
  private clicks: { x: number; y: number }[] = [];
  private keysPressed = new Set<string>();

  constructor(private canvas: HTMLCanvasElement) {
    canvas.addEventListener('pointermove', (e) => this.updatePointer(e));
    canvas.addEventListener('pointerdown', (e) => {
      this.updatePointer(e);
      this.pointer.down = true;
    });
    window.addEventListener('pointerup', (e) => {
      if (!this.pointer.down) return;
      this.updatePointer(e);
      this.pointer.down = false;
      this.clicks.push({ x: this.pointer.x, y: this.pointer.y });
    });
    window.addEventListener('keydown', (e) => this.keysPressed.add(e.code));
  }

  consumeClicks(): { x: number; y: number }[] {
    const clicks = this.clicks;
    this.clicks = [];
    return clicks;
  }

  consumeKeys(): Set<string> {
    const keys = this.keysPressed;
    this.keysPressed = new Set();
    return keys;
  }

  private updatePointer(e: PointerEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.x = Math.floor(((e.clientX - rect.left) / rect.width) * NATIVE_WIDTH);
    this.pointer.y = Math.floor(((e.clientY - rect.top) / rect.height) * NATIVE_HEIGHT);
  }
}
