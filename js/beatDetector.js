// Beat detection: decodes an audio file in-browser and estimates tempo (BPM),
// the beat grid, and a per-beat energy value used later to drive edit pacing.
//
// Method: spectral-flux onset novelty curve (FFT magnitude, positive frame-to-frame
// difference summed across bins) -> autocorrelation over the 60-200 BPM lag range
// (with a mild prior toward ~120 BPM to avoid octave errors) -> comb-filter phase
// search to lock the beat grid to the actual onsets in the track.

function fftInPlace(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      let tr = re[i]; re[i] = re[j]; re[j] = tr;
      let ti = im[i]; im[i] = im[j]; im[j] = ti;
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let curWr = 1, curWi = 0;
      const half = len >> 1;
      for (let k = 0; k < half; k++) {
        const ur = re[i + k], ui = im[i + k];
        const vr = re[i + k + half] * curWr - im[i + k + half] * curWi;
        const vi = re[i + k + half] * curWi + im[i + k + half] * curWr;
        re[i + k] = ur + vr; im[i + k] = ui + vi;
        re[i + k + half] = ur - vr; im[i + k + half] = ui - vi;
        const nWr = curWr * wr - curWi * wi;
        const nWi = curWr * wi + curWi * wr;
        curWr = nWr; curWi = nWi;
      }
    }
  }
}

function nextPow2(n) {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

/**
 * Pure DSP core: works on a mono Float32Array, no browser APIs.
 * @returns {{bpm:number, periodSeconds:number, firstBeatSeconds:number, beatTimes:number[], beatEnergy:number[], novelty:Float32Array, hopSeconds:number}}
 */
export function analyzeSamples(samples, sampleRate, opts = {}) {
  const frameSize = opts.frameSize || 2048;
  const hop = opts.hop || 512;
  const hopSeconds = hop / sampleRate;

  const window = new Float32Array(frameSize);
  for (let i = 0; i < frameSize; i++) {
    window[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (frameSize - 1));
  }

  const numFrames = Math.max(1, Math.floor((samples.length - frameSize) / hop) + 1);
  const novelty = new Float32Array(numFrames);
  const prevMag = new Float32Array(frameSize / 2);
  const re = new Float32Array(frameSize);
  const im = new Float32Array(frameSize);

  for (let f = 0; f < numFrames; f++) {
    const start = f * hop;
    for (let i = 0; i < frameSize; i++) {
      const s = samples[start + i];
      re[i] = (s === undefined ? 0 : s) * window[i];
      im[i] = 0;
    }
    fftInPlace(re, im);
    let flux = 0;
    for (let k = 0; k < frameSize / 2; k++) {
      const mag = Math.hypot(re[k], im[k]);
      const diff = mag - prevMag[k];
      if (diff > 0) flux += diff;
      prevMag[k] = mag;
    }
    novelty[f] = flux;
  }

  let maxN = 0;
  for (let i = 0; i < novelty.length; i++) maxN = Math.max(maxN, novelty[i]);
  if (maxN > 0) for (let i = 0; i < novelty.length; i++) novelty[i] /= maxN;

  const minBpm = opts.minBpm || 70, maxBpm = opts.maxBpm || 190;
  const lagMinFrames = Math.max(1, Math.round((60 / maxBpm) / hopSeconds));
  const lagMaxFrames = Math.max(lagMinFrames + 1, Math.round((60 / minBpm) / hopSeconds));

  let bestLag = lagMinFrames, bestScore = -Infinity;
  for (let lag = lagMinFrames; lag <= lagMaxFrames; lag++) {
    let score = 0;
    for (let i = 0; i + lag < novelty.length; i++) score += novelty[i] * novelty[i + lag];
    const bpm = 60 / (lag * hopSeconds);
    const logBias = Math.log2(bpm / 120);
    const prior = Math.exp(-0.5 * (logBias / 0.9) ** 2);
    score *= prior;
    if (score > bestScore) { bestScore = score; bestLag = lag; }
  }

  const periodFrames = bestLag;
  const periodSeconds = periodFrames * hopSeconds;
  const bpm = 60 / periodSeconds;

  let bestPhase = 0, bestPhaseScore = -Infinity;
  for (let phase = 0; phase < periodFrames; phase++) {
    let score = 0;
    for (let i = phase; i < novelty.length; i += periodFrames) score += novelty[i];
    if (score > bestPhaseScore) { bestPhaseScore = score; bestPhase = phase; }
  }

  const firstBeatSeconds = bestPhase * hopSeconds;
  const durationSeconds = samples.length / sampleRate;
  const beatTimes = [];
  for (let t = firstBeatSeconds; t < durationSeconds; t += periodSeconds) beatTimes.push(t);

  const beatEnergyRaw = beatTimes.map((t) => {
    const centerFrame = Math.round(t / hopSeconds);
    let peak = 0;
    for (let d = -2; d <= 2; d++) {
      const idx = centerFrame + d;
      if (idx >= 0 && idx < novelty.length) peak = Math.max(peak, novelty[idx]);
    }
    return peak;
  });
  const maxE = Math.max(1e-6, ...beatEnergyRaw);
  const beatEnergy = beatEnergyRaw.map((e) => e / maxE);

  return { bpm, periodSeconds, firstBeatSeconds, beatTimes, beatEnergy, novelty, hopSeconds, durationSeconds };
}

/**
 * Decodes an uploaded audio File in the browser and runs beat analysis.
 * @param {File} file
 * @param {(msg:string)=>void} [onStatus]
 */
export async function analyzeAudioFile(file, onStatus) {
  onStatus?.('Decodifica audio…');
  const arrayBuffer = await file.arrayBuffer();
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const ctx = new AudioCtx();
  let audioBuffer;
  try {
    audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
  } finally {
    ctx.close?.();
  }

  const channels = audioBuffer.numberOfChannels;
  const len = audioBuffer.length;
  const mono = new Float32Array(len);
  for (let c = 0; c < channels; c++) {
    const data = audioBuffer.getChannelData(c);
    for (let i = 0; i < len; i++) mono[i] += data[i] / channels;
  }

  onStatus?.('Analisi del ritmo (BPM) in corso…');
  await new Promise((r) => setTimeout(r, 0)); // let the UI paint the status message
  const analysis = analyzeSamples(mono, audioBuffer.sampleRate);

  // Downsampled peaks for waveform drawing (min/max per bucket), independent of analysis resolution.
  const peakBuckets = 2000;
  const bucketSize = Math.max(1, Math.floor(len / peakBuckets));
  const peaksMin = new Float32Array(Math.ceil(len / bucketSize));
  const peaksMax = new Float32Array(Math.ceil(len / bucketSize));
  for (let b = 0, i = 0; i < len; b++, i += bucketSize) {
    let mn = 1, mx = -1;
    const end = Math.min(len, i + bucketSize);
    for (let j = i; j < end; j++) {
      const v = mono[j];
      if (v < mn) mn = v;
      if (v > mx) mx = v;
    }
    peaksMin[b] = mn; peaksMax[b] = mx;
  }

  return {
    ...analysis,
    sampleRate: audioBuffer.sampleRate,
    duration: audioBuffer.duration,
    peaksMin, peaksMax, peakBucketSeconds: (bucketSize / audioBuffer.sampleRate),
  };
}
