export const TICK_RATE = 60;
export const TICK_SECONDS = 1 / TICK_RATE;
const MAX_FRAME_SECONDS = 0.25;

export interface LoopHandlers {
  update(dt: number): void;
  render(): void;
}

// Fixed-timestep updates keep combat timers deterministic regardless of display refresh rate.
export function startLoop(handlers: LoopHandlers): void {
  let last = performance.now();
  let accumulator = 0;

  const frame = (now: number) => {
    accumulator += Math.min((now - last) / 1000, MAX_FRAME_SECONDS);
    last = now;
    while (accumulator >= TICK_SECONDS) {
      handlers.update(TICK_SECONDS);
      accumulator -= TICK_SECONDS;
    }
    handlers.render();
    requestAnimationFrame(frame);
  };

  requestAnimationFrame(frame);
}
