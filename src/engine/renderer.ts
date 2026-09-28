export const NATIVE_WIDTH = 480;
export const NATIVE_HEIGHT = 270;

export class Renderer {
  readonly ctx: CanvasRenderingContext2D;
  scale = 1;

  constructor(readonly canvas: HTMLCanvasElement) {
    canvas.width = NATIVE_WIDTH;
    canvas.height = NATIVE_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    ctx.imageSmoothingEnabled = false;
    this.ctx = ctx;
    this.fitToWindow();
    window.addEventListener('resize', () => this.fitToWindow());
  }

  // Integer scaling only, so every art pixel maps to an exact block of screen pixels.
  fitToWindow(): void {
    const dpr = window.devicePixelRatio || 1;
    const maxScale = Math.min(
      (window.innerWidth * dpr) / NATIVE_WIDTH,
      (window.innerHeight * dpr) / NATIVE_HEIGHT,
    );
    this.scale = Math.max(1, Math.floor(maxScale));
    this.canvas.style.width = `${(NATIVE_WIDTH * this.scale) / dpr}px`;
    this.canvas.style.height = `${(NATIVE_HEIGHT * this.scale) / dpr}px`;
  }

  clear(color = '#000'): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, NATIVE_WIDTH, NATIVE_HEIGHT);
  }
}
