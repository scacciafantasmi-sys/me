// Interactive canvas: draws the song's waveform, the detected beat grid, a
// draggable start/end selection (which portion of the song to use for the
// edit), and — once an EDL exists — the resulting cut/transition markers.

const CLIP_COLORS = [
  '#ff2d78', '#25f4ee', '#ffd23f', '#7c5cff', '#2bd576', '#ff8a3d', '#4dc3ff', '#ff5c9e',
];

export class Waveform {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.analysis = null;
    this.range = { start: 0, end: 0 };
    this.edl = null;
    this.onRangeChange = null;
    this._drag = null;

    canvas.addEventListener('pointerdown', this._onPointerDown.bind(this));
    window.addEventListener('pointermove', this._onPointerMove.bind(this));
    window.addEventListener('pointerup', this._onPointerUp.bind(this));
    window.addEventListener('resize', () => this.draw());
  }

  setAudio(analysis) {
    this.analysis = analysis;
    this.range = { start: 0, end: analysis.duration };
    this.edl = null;
    this.draw();
  }

  setRange(start, end) {
    if (!this.analysis) return;
    const d = this.analysis.duration;
    this.range = {
      start: Math.max(0, Math.min(start, end - 0.5)),
      end: Math.min(d, Math.max(end, start + 0.5)),
    };
    this.draw();
    this.onRangeChange?.(this.range);
  }

  getRange() {
    return this.range;
  }

  setEDL(edl) {
    this.edl = edl;
    this.draw();
  }

  _layout() {
    const canvas = this.canvas;
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth || 600;
    const cssH = canvas.clientHeight || 140;
    if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
    }
    return { w: cssW, h: cssH, dpr };
  }

  _timeToX(t, w) {
    const d = this.analysis?.duration || 1;
    return (t / d) * w;
  }

  _xToTime(x, w) {
    const d = this.analysis?.duration || 1;
    return Math.max(0, Math.min(d, (x / w) * d));
  }

  draw() {
    const { ctx, canvas } = this;
    const { w, h, dpr } = this._layout();
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const styles = getComputedStyle(document.documentElement);
    const fg = styles.getPropertyValue('--wave-fg').trim() || '#ff2d78';
    const dim = styles.getPropertyValue('--wave-dim').trim() || 'rgba(255,255,255,0.18)';
    const grid = styles.getPropertyValue('--wave-grid').trim() || 'rgba(255,255,255,0.35)';

    if (!this.analysis) {
      ctx.fillStyle = dim;
      ctx.fillRect(0, h / 2 - 1, w, 2);
      ctx.restore();
      return;
    }

    const { peaksMin, peaksMax, duration, beatTimes } = this.analysis;
    const mid = h / 2;

    // Waveform
    ctx.fillStyle = dim;
    for (let x = 0; x < w; x++) {
      const bucket = Math.floor((x / w) * peaksMin.length);
      const mn = peaksMin[bucket] || 0;
      const mx = peaksMax[bucket] || 0;
      const y1 = mid + mn * (mid - 6);
      const y2 = mid + mx * (mid - 6);
      ctx.fillRect(x, Math.min(y1, y2), 1, Math.max(1, Math.abs(y2 - y1)));
    }

    // Out-of-range dimming
    const xStart = this._timeToX(this.range.start, w);
    const xEnd = this._timeToX(this.range.end, w);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, xStart, h);
    ctx.fillRect(xEnd, 0, w - xEnd, h);

    // Beat grid ticks (only within range, thin)
    ctx.strokeStyle = grid;
    ctx.lineWidth = 1;
    for (const t of beatTimes) {
      if (t < this.range.start || t > this.range.end) continue;
      const x = this._timeToX(t, w);
      ctx.beginPath();
      ctx.moveTo(x + 0.5, h - 10);
      ctx.lineTo(x + 0.5, h);
      ctx.stroke();
    }

    // EDL segment/transition overlay
    if (this.edl) {
      let t = this.range.start;
      this.edl.segments.forEach((seg, i) => {
        const x1 = this._timeToX(t, w);
        const segDur = seg.duration - (i < this.edl.transitions.length ? this.edl.transitions[i].duration : 0);
        const x2 = this._timeToX(t + Math.max(0, segDur), w);
        ctx.fillStyle = CLIP_COLORS[seg.sceneIndex % CLIP_COLORS.length];
        ctx.globalAlpha = 0.75;
        ctx.fillRect(x1, 4, Math.max(1, x2 - x1), 6);
        ctx.globalAlpha = 1;
        if (i < this.edl.transitions.length) {
          t += segDur + this.edl.transitions[i].duration;
          const xt = this._timeToX(t - this.edl.transitions[i].duration / 2, w);
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.moveTo(xt, 0);
          ctx.lineTo(xt + 4, 6);
          ctx.lineTo(xt, 12);
          ctx.lineTo(xt - 4, 6);
          ctx.closePath();
          ctx.fill();
        }
      });
    }

    // Range handles
    ctx.fillStyle = fg;
    ctx.fillRect(xStart - 2, 0, 4, h);
    ctx.fillRect(xEnd - 2, 0, 4, h);

    ctx.restore();
  }

  _onPointerDown(e) {
    if (!this.analysis) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const w = rect.width;
    const xStart = this._timeToX(this.range.start, w);
    const xEnd = this._timeToX(this.range.end, w);
    const handle = Math.abs(x - xStart) < 10 ? 'start' : Math.abs(x - xEnd) < 10 ? 'end' : null;
    if (handle) {
      this._drag = { handle, w };
      this.canvas.setPointerCapture?.(e.pointerId);
    }
  }

  _onPointerMove(e) {
    if (!this._drag || !this.analysis) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const t = this._xToTime(x, rect.width);
    if (this._drag.handle === 'start') this.setRange(t, this.range.end);
    else this.setRange(this.range.start, t);
  }

  _onPointerUp() {
    this._drag = null;
  }
}

export { CLIP_COLORS };
