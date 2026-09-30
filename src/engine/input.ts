import { NATIVE_HEIGHT, NATIVE_WIDTH } from './renderer';

// Scenes that don't read typed keys never drain the buffer, so it keeps only the latest few.
const TYPED_LIMIT = 32;

export interface PointerState {
  x: number;
  y: number;
  down: boolean;
}

export class Input {
  readonly pointer: PointerState = { x: 0, y: 0, down: false };
  private clicks: { x: number; y: number }[] = [];
  private presses: { x: number; y: number }[] = [];
  private keysPressed = new Set<string>();
  private wheelSteps = 0;
  private typed: string[] = [];

  constructor(private canvas: HTMLCanvasElement) {
    canvas.addEventListener('pointermove', (e) => this.updatePointer(e));
    canvas.addEventListener('pointerdown', (e) => {
      this.updatePointer(e);
      this.pointer.down = true;
      this.presses.push({ x: this.pointer.x, y: this.pointer.y });
      // Keeps pointermove flowing to the canvas while dragging outside it.
      canvas.setPointerCapture(e.pointerId);
    });
    // The browser's own drag-and-drop or text selection would swallow pointerup and leave the button stuck down.
    canvas.addEventListener('dragstart', (e) => e.preventDefault());
    canvas.addEventListener('selectstart', (e) => e.preventDefault());
    canvas.addEventListener('pointercancel', () => {
      this.pointer.down = false;
    });
    window.addEventListener('pointerup', (e) => {
      if (!this.pointer.down) return;
      this.updatePointer(e);
      this.pointer.down = false;
      this.clicks.push({ x: this.pointer.x, y: this.pointer.y });
    });
    window.addEventListener('keydown', (e) => {
      this.keysPressed.add(e.code);
      if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Escape') {
        this.typed.push(e.key);
        if (this.typed.length > TYPED_LIMIT) this.typed.shift();
      }
    });
    canvas.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        this.wheelSteps += Math.sign(e.deltaY);
      },
      { passive: false },
    );
  }

  consumeClicks(): { x: number; y: number }[] {
    const clicks = this.clicks;
    this.clicks = [];
    return clicks;
  }

  consumePresses(): { x: number; y: number }[] {
    const presses = this.presses;
    this.presses = [];
    return presses;
  }

  // Printable characters as typed (e.key), plus 'Backspace' and 'Escape'.
  consumeTyped(): string[] {
    const typed = this.typed;
    this.typed = [];
    return typed;
  }

  // Positive scrolls down.
  consumeWheel(): number {
    const steps = this.wheelSteps;
    this.wheelSteps = 0;
    return steps;
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
