// Automatic scene-cut detection for long source videos (e.g. a "scene pack"
// imported from YouTube): reuses ffmpeg.wasm's own scene-change score
// (the same heuristic native ffmpeg uses for `select='gt(scene,T)'`, driven
// by frame-to-frame pixel difference — in practice this fires on hard cuts
// and on fast/large motion, which is exactly the "cut on movement" behaviour
// real edits want) and reads the cut timestamps back out of ffmpeg's own log.

import { getFFmpeg, getFetchFile, extOf } from './ffmpegEngine.js';

const MIN_SCENE_SECONDS = 1.0;

/**
 * @param {File} file
 * @param {object} [opts]
 * @param {number} [opts.threshold] - scene-change sensitivity, 0..1 (lower = more cuts)
 * @param {number} [opts.minSceneSeconds] - merge cuts closer together than this
 * @param {number} [opts.duration] - known duration of the file, to close the last scene
 * @param {(msg:string)=>void} [opts.onLog]
 * @returns {Promise<number[]>} sorted cut timestamps (seconds), excluding 0 and the end
 */
export async function detectSceneCuts(file, { threshold = 0.35, minSceneSeconds = MIN_SCENE_SECONDS, onLog } = {}) {
  const ffmpeg = await getFFmpeg();
  const fetchFile = await getFetchFile();
  const name = `scenein_${Date.now()}${extOf(file, '.mp4')}`;
  await ffmpeg.writeFile(name, await fetchFile(file));

  const cuts = [];
  const logHandler = ({ message }) => {
    onLog?.(message);
    const m = /pts_time:\s*([0-9.]+)/.exec(message);
    if (m) cuts.push(parseFloat(m[1]));
  };
  ffmpeg.on('log', logHandler);

  try {
    await ffmpeg.exec([
      '-i', name,
      '-filter:v', `select='gt(scene,${threshold})',showinfo`,
      '-f', 'null', '-',
    ]);
  } finally {
    ffmpeg.off('log', logHandler);
    await ffmpeg.deleteFile(name).catch(() => {});
  }

  cuts.sort((a, b) => a - b);
  const merged = [];
  for (const t of cuts) {
    if (merged.length === 0 || t - merged[merged.length - 1] >= minSceneSeconds) merged.push(t);
  }
  return merged;
}

/**
 * Turns cut timestamps into scene windows [{start, end}] covering [0, duration].
 * Drops any trailing window shorter than minSceneSeconds by merging it back.
 */
export function cutsToWindows(cuts, duration, minSceneSeconds = MIN_SCENE_SECONDS) {
  const bounds = [0, ...cuts.filter((t) => t > 0 && t < duration), duration];
  const windows = [];
  for (let i = 0; i < bounds.length - 1; i++) {
    windows.push({ start: bounds[i], end: bounds[i + 1] });
  }
  if (windows.length > 1) {
    const last = windows[windows.length - 1];
    if (last.end - last.start < minSceneSeconds) {
      windows[windows.length - 2].end = last.end;
      windows.pop();
    }
  }
  return windows;
}
