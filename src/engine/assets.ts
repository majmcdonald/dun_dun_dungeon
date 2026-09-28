export interface AssetManifest {
  images?: Record<string, string>;
  audio?: Record<string, string>;
}

export class Assets {
  private images = new Map<string, HTMLImageElement>();
  private audio = new Map<string, HTMLAudioElement>();

  async load(manifest: AssetManifest): Promise<void> {
    const imageLoads = Object.entries(manifest.images ?? {}).map(([key, url]) =>
      loadImage(url).then((img) => this.images.set(key, img)),
    );
    const audioLoads = Object.entries(manifest.audio ?? {}).map(([key, url]) =>
      loadAudio(url).then((el) => this.audio.set(key, el)),
    );
    await Promise.all([...imageLoads, ...audioLoads]);
  }

  image(key: string): HTMLImageElement {
    const img = this.images.get(key);
    if (!img) throw new Error(`Image not loaded: ${key}`);
    return img;
  }

  sound(key: string): HTMLAudioElement {
    const el = this.audio.get(key);
    if (!el) throw new Error(`Audio not loaded: ${key}`);
    return el;
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

function loadAudio(url: string): Promise<HTMLAudioElement> {
  return new Promise((resolve, reject) => {
    const el = new Audio();
    el.addEventListener('canplaythrough', () => resolve(el), { once: true });
    el.addEventListener('error', () => reject(new Error(`Failed to load audio: ${url}`)), {
      once: true,
    });
    el.src = url;
    el.load();
  });
}
