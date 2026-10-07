// Tiled sprite sheet + simple frame animator (cocos2d-style tiled-texture-region
// equivalent to AndEngine's ITiledTextureRegion).

export class TileSheet {
  /**
   * @param {HTMLImageElement} image
   * @param {number} cols
   * @param {number} rows
   */
  constructor(image, cols, rows) {
    this.image = image;
    this.cols = cols;
    this.rows = rows;
    this.tileW = image.width / cols;
    this.tileH = image.height / rows;
  }

  /** Returns {sx, sy, sw, sh} for a tile index (row-major, matches AndEngine tiling order). */
  frameRect(index) {
    const col = index % this.cols;
    const row = Math.floor(index / this.cols);
    return {
      sx: col * this.tileW,
      sy: row * this.tileH,
      sw: this.tileW,
      sh: this.tileH,
    };
  }
}

export class Animator {
  /**
   * @param {TileSheet} sheet
   * @param {number[]} durationsMs one duration per frame
   * @param {number} first first tile index (inclusive)
   * @param {number} last last tile index (inclusive)
   * @param {boolean} loop
   * @param {() => void} [onFinished]
   */
  constructor(sheet, durationsMs, first, last, loop, onFinished) {
    this.sheet = sheet;
    this.durations = durationsMs;
    this.first = first;
    this.last = last;
    this.loop = loop;
    this.onFinished = onFinished;
    this.frameIndex = 0;
    this.elapsed = 0;
    this.done = false;
  }

  get currentTile() {
    return this.first + this.frameIndex;
  }

  update(dtMs) {
    if (this.done) return;
    this.elapsed += dtMs;
    const dur = this.durations[this.frameIndex] ?? this.durations[this.durations.length - 1];
    if (this.elapsed >= dur) {
      this.elapsed -= dur;
      this.frameIndex++;
      const frameCount = this.last - this.first + 1;
      if (this.frameIndex >= frameCount) {
        if (this.loop) {
          this.frameIndex = 0;
        } else {
          this.frameIndex = frameCount - 1;
          this.done = true;
          if (this.onFinished) this.onFinished();
        }
      }
    }
  }
}
