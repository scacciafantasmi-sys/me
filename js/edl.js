import { pickTransition } from './transitions.js';

const MIN_SEGMENT_SECONDS = 0.20;
const MIN_TRANSITION_SECONDS = 0.08;
const MAX_TRANSITION_SECONDS = 0.55;

function spanForPace(pace, energy, beatIndex) {
  if (pace === 'fast') return 1;
  if (pace === 'medium') return 2;
  if (pace === 'chill') return beatIndex % 2 === 0 ? 3 : 4;
  // auto: dynamic pacing driven by the track's own energy at that beat —
  // this is what makes it feel like a real edit instead of a metronome.
  if (energy > 0.66) return 1;
  if (energy > 0.33) return 2;
  return 3;
}

/**
 * Builds the beat-synced cut list (start/end seconds within the song) before
 * any footage is assigned to it.
 */
function buildBeatSegments(beatInfo, songRange, pace) {
  const { beatTimes, beatEnergy, periodSeconds } = beatInfo;
  let idxs = [];
  for (let i = 0; i < beatTimes.length; i++) {
    if (beatTimes[i] >= songRange.start && beatTimes[i] <= songRange.end) idxs.push(i);
  }

  // Fallback grid if detection produced too few beats in the chosen range.
  if (idxs.length < 2) {
    const grid = [];
    const period = periodSeconds > 0.05 ? periodSeconds : 0.5;
    for (let t = songRange.start; t < songRange.end; t += period) grid.push(t);
    grid.push(songRange.end);
    const cuts = [];
    for (let i = 0; i < grid.length - 1; i++) {
      cuts.push({ start: grid[i], end: grid[i + 1], energy: 0.5 });
    }
    return cuts;
  }

  const beats = idxs.map((i) => beatTimes[i]);
  const energies = idxs.map((i) => beatEnergy[i]);
  if (beats[0] > songRange.start) { beats.unshift(songRange.start); energies.unshift(energies[0] ?? 0.4); }
  if (beats[beats.length - 1] < songRange.end) { beats.push(songRange.end); energies.push(energies[energies.length - 1] ?? 0.4); }

  const cuts = [];
  let i = 0, span = 0;
  while (i < beats.length - 1) {
    const s = spanForPace(pace, energies[i], span++);
    let endIdx = Math.min(i + s, beats.length - 1);
    if (beats[endIdx] - beats[i] < MIN_SEGMENT_SECONDS && endIdx < beats.length - 1) endIdx++;
    cuts.push({ start: beats[i], end: beats[endIdx], energy: energies[Math.min(endIdx, energies.length - 1)] });
    i = endIdx;
  }
  // Merge a too-short trailing sliver into the previous cut instead of
  // producing a near-zero-length segment ffmpeg can't cross-fade cleanly.
  if (cuts.length > 1) {
    const last = cuts[cuts.length - 1];
    if (last.end - last.start < MIN_SEGMENT_SECONDS) {
      cuts[cuts.length - 2].end = last.end;
      cuts.pop();
    }
  }
  return cuts;
}

/**
 * Assigns real footage to each beat-synced cut, cycling through the supplied
 * scenes and continuing playback position within a scene across reuses so the
 * same scene shown three times shows three different moments of itself.
 *
 * A "scene" is a window [windowStart, windowStart+duration) inside some
 * underlying source file (sourceIndex = which ffmpeg -i input it lives in).
 * Several scenes can share the same sourceIndex (e.g. one long imported
 * video auto-split into many scenes) — the source file is only ever passed
 * to ffmpeg once, no matter how many scenes reference it.
 */
function assignFootage(cuts, scenes) {
  const playheads = scenes.map(() => 0);
  let ptr = 0;
  const segments = [];
  for (const cut of cuts) {
    const want = cut.end - cut.start;
    const si = ptr % scenes.length;
    ptr++;
    const scene = scenes[si];
    let inPoint = playheads[si];
    if (scene.duration - inPoint < 0.08) inPoint = 0;
    const take = Math.min(want, scene.duration - inPoint);
    const outPoint = inPoint + Math.max(take, Math.min(0.08, scene.duration));
    playheads[si] = outPoint >= scene.duration - 0.03 ? 0 : outPoint;
    const windowStart = scene.windowStart || 0;
    segments.push({
      sceneIndex: si,
      sourceIndex: scene.sourceIndex ?? si,
      inPoint: inPoint + windowStart,
      outPoint: outPoint + windowStart,
      duration: outPoint - inPoint,
      energy: cut.energy,
    });
  }
  return segments;
}

/**
 * Builds the full Edit Decision List: which footage plays when, with which
 * transitions, and the exact ffmpeg xfade offsets to realize it.
 *
 * @param {object} args
 * @param {{beatTimes:number[], beatEnergy:number[], periodSeconds:number}} args.beatInfo
 * @param {{duration:number, sourceIndex?:number, windowStart?:number}[]} args.scenes - only the included scenes, in play order
 * @param {{start:number,end:number}} args.songRange
 * @param {'auto'|'fast'|'medium'|'chill'} args.pace
 * @param {string} args.stylePool - 'mix' | 'subtle' | 'flashy' | 'all' | a fixed transition name
 */
export function buildEDL({ beatInfo, scenes, songRange, pace = 'auto', stylePool = 'mix', rng = Math.random }) {
  if (!scenes || scenes.length === 0) throw new Error('Nessuna clip disponibile per generare l\'edit.');

  const cuts = buildBeatSegments(beatInfo, songRange, pace);
  const segments = assignFootage(cuts, scenes);

  // Transition durations, clamped so xfade always has enough overlap on both sides.
  const transitionDurations = [];
  for (let i = 0; i < segments.length - 1; i++) {
    let dur = (beatInfo.periodSeconds || 0.5) * 0.4;
    dur = Math.min(dur, MAX_TRANSITION_SECONDS, segments[i].duration * 0.85, segments[i + 1].duration * 0.85);
    dur = Math.max(dur, MIN_TRANSITION_SECONDS);
    if (dur * 2 > segments[i].duration || dur * 2 > segments[i + 1].duration) {
      dur = Math.max(0.05, Math.min(segments[i].duration, segments[i + 1].duration) * 0.4);
    }
    transitionDurations.push(dur);
  }

  const transitions = [];
  let lastType = null;
  for (let i = 0; i < transitionDurations.length; i++) {
    const energy = segments[i + 1].energy ?? 0.5;
    const type = pickTransition(stylePool, energy, lastType, rng);
    lastType = type;
    transitions.push({ type, duration: transitionDurations[i] });
  }

  // Precompute the cumulative xfade offsets so the ffmpeg engine only has to
  // stitch a filtergraph together, with no timeline math of its own.
  const offsets = [];
  let acc = segments[0].duration;
  for (let i = 0; i < transitions.length; i++) {
    const t = transitions[i].duration;
    offsets.push(acc - t);
    acc = acc - t + segments[i + 1].duration;
  }
  const totalDuration = acc;

  return {
    segments,
    transitions,
    offsets,
    totalDuration,
    audio: { start: songRange.start, end: songRange.start + totalDuration },
    bpm: beatInfo.bpm,
  };
}
