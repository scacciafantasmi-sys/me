// Pools of ffmpeg `xfade` transition types used to emulate real TikTok/CapCut
// style edits — never a plain fade, always something with motion or a wipe/shape.
// Split into a "subtle" pool for ordinary on-beat cuts and a "flashy" pool
// reserved for high-energy beats and accent moments, which is how real edits
// read: most cuts are quick and clean, a few are the showy ones.

export const SUBTLE_TRANSITIONS = [
  'fade', 'dissolve', 'hblur',
  'wipeleft', 'wiperight', 'wipeup', 'wipedown',
  'slideleft', 'slideright', 'slideup', 'slidedown',
  'smoothleft', 'smoothright', 'smoothup', 'smoothdown',
];

export const FLASHY_TRANSITIONS = [
  'circleopen', 'circleclose', 'circlecrop', 'rectcrop', 'radial',
  'pixelize', 'distance', 'zoomin',
  'diagtl', 'diagtr', 'diagbl', 'diagbr',
  'hlslice', 'hrslice', 'vuslice', 'vdslice',
  'wipetl', 'wipetr', 'wipebl', 'wipebr',
  'squeezeh', 'squeezev',
  'vertopen', 'vertclose', 'horzopen', 'horzclose',
  'fadeblack', 'fadewhite',
];

export const ALL_TRANSITIONS = [...SUBTLE_TRANSITIONS, ...FLASHY_TRANSITIONS];

/**
 * Picks a transition type given the energy of the upcoming cut (0..1),
 * a stylePool ('mix' | 'subtle' | 'flashy' | 'all' | a single fixed name),
 * and the previously used type (to avoid immediate repeats).
 */
export function pickTransition(stylePool, energy, lastType, rng = Math.random) {
  if (stylePool && stylePool !== 'mix' && stylePool !== 'all' && ALL_TRANSITIONS.includes(stylePool)) {
    return stylePool; // fixed single transition requested by the user
  }

  let pool;
  if (stylePool === 'all') {
    pool = ALL_TRANSITIONS;
  } else if (stylePool === 'subtle') {
    pool = SUBTLE_TRANSITIONS;
  } else if (stylePool === 'flashy') {
    pool = FLASHY_TRANSITIONS;
  } else {
    // 'mix' (default): flashy on energetic cuts, subtle otherwise, with a
    // small chance of crossing over so it never feels too mechanical.
    const useFlashy = energy > 0.62 ? rng() < 0.85 : rng() < 0.12;
    pool = useFlashy ? FLASHY_TRANSITIONS : SUBTLE_TRANSITIONS;
  }

  let candidates = pool.filter((t) => t !== lastType);
  if (candidates.length === 0) candidates = pool;
  return candidates[Math.floor(rng() * candidates.length)];
}
