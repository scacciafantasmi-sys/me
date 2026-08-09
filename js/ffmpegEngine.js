// Wraps ffmpeg.wasm (loaded lazily from a CDN, single-threaded core so it
// runs on plain GitHub Pages without cross-origin-isolation headers) and
// turns an Edit Decision List into one ffmpeg filter_complex render.

const FFMPEG_JS = 'https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12/dist/esm/index.js';
const FFMPEG_UTIL_JS = 'https://cdn.jsdelivr.net/npm/@ffmpeg/util@0.12/dist/esm/index.js';
const FFMPEG_CORE_BASE = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12/dist/umd';

let ffmpegPromise = null;

async function getFFmpeg(onLog) {
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
      const [{ FFmpeg }, { toBlobURL }] = await Promise.all([
        import(/* webpackIgnore: true */ FFMPEG_JS),
        import(/* webpackIgnore: true */ FFMPEG_UTIL_JS),
      ]);
      const ffmpeg = new FFmpeg();
      if (onLog) ffmpeg.on('log', ({ message }) => onLog(message));
      const [coreURL, wasmURL] = await Promise.all([
        toBlobURL(`${FFMPEG_CORE_BASE}/ffmpeg-core.js`, 'text/javascript'),
        toBlobURL(`${FFMPEG_CORE_BASE}/ffmpeg-core.wasm`, 'application/wasm'),
      ]);
      await ffmpeg.load({ coreURL, wasmURL });
      return ffmpeg;
    })();
  }
  return ffmpegPromise;
}

function extOf(file, fallback) {
  const m = /\.([a-zA-Z0-9]+)$/.exec(file?.name || '');
  return m ? `.${m[1].toLowerCase()}` : fallback;
}

function n(x, d = 3) {
  return Number(x).toFixed(d);
}

/**
 * Builds the ffmpeg filter_complex graph string for a given EDL.
 * clipInputNames[i] is the ffmpeg-FS filename used for the -i at index i.
 */
export function buildFilterComplex(edl, { width, height, fps }) {
  const { segments, transitions, offsets } = edl;
  const chains = [];

  segments.forEach((seg, i) => {
    chains.push(
      `[${seg.clipIndex}:v]trim=start=${n(seg.inPoint)}:end=${n(seg.outPoint)},` +
      `setpts=PTS-STARTPTS,fps=${fps},` +
      `scale=${width}:${height}:force_original_aspect_ratio=increase,` +
      `crop=${width}:${height},setsar=1,format=yuv420p[v${i}]`
    );
  });

  let finalVideoLabel = 'v0';
  if (segments.length > 1) {
    let prev = 'v0';
    for (let i = 1; i < segments.length; i++) {
      const out = i === segments.length - 1 ? 'vout' : `vx${i}`;
      const tr = transitions[i - 1];
      const offset = offsets[i - 1];
      chains.push(`[${prev}][v${i}]xfade=transition=${tr.type}:duration=${n(tr.duration)}:offset=${n(offset)}[${out}]`);
      prev = out;
    }
    finalVideoLabel = 'vout';
  }

  const audioInputIndex = edl.audioInputIndex;
  const audioDur = Math.max(0.2, edl.audio.end - edl.audio.start);
  const fadeOutDur = Math.min(0.35, audioDur * 0.3);
  const fadeOutStart = Math.max(0, audioDur - fadeOutDur);
  chains.push(
    `[${audioInputIndex}:a]atrim=start=${n(edl.audio.start)}:end=${n(edl.audio.end)},` +
    `asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.05,` +
    `afade=t=out:st=${n(fadeOutStart)}:d=${n(fadeOutDur)}[aout]`
  );

  return {
    filterComplex: chains.join(';'),
    videoLabel: segments.length > 1 ? 'vout' : finalVideoLabel,
    audioLabel: 'aout',
  };
}

/**
 * Renders the final MP4 in-browser via ffmpeg.wasm.
 * @param {object} args
 * @param {object} args.edl - result of buildEDL(), plus clips already deduped in play order
 * @param {File[]} args.clipFiles - one File per clip, indices matching edl.segments[].clipIndex
 * @param {File} args.audioFile
 * @param {{width:number, height:number, fps:number, crf:number, preset:string}} args.quality
 * @param {(ratio:number)=>void} [args.onProgress]
 * @param {(msg:string)=>void} [args.onLog]
 */
export async function renderEdit({ edl, clipFiles, audioFile, quality, onProgress, onLog }) {
  const ffmpeg = await getFFmpeg(onLog);
  const { fetchFile } = await import(/* webpackIgnore: true */ FFMPEG_UTIL_JS);

  const progressHandler = ({ progress }) => {
    if (Number.isFinite(progress)) onProgress?.(Math.min(1, Math.max(0, progress)));
  };
  ffmpeg.on('progress', progressHandler);

  try {
    const clipNames = [];
    for (let i = 0; i < clipFiles.length; i++) {
      const name = `clip${i}${extOf(clipFiles[i], '.mp4')}`;
      await ffmpeg.writeFile(name, await fetchFile(clipFiles[i]));
      clipNames.push(name);
    }
    const audioName = `audio${extOf(audioFile, '.mp3')}`;
    await ffmpeg.writeFile(audioName, await fetchFile(audioFile));

    const edlWithAudioIndex = { ...edl, audioInputIndex: clipFiles.length };
    const { filterComplex, videoLabel, audioLabel } = buildFilterComplex(edlWithAudioIndex, quality);

    const args = [];
    for (const name of clipNames) args.push('-i', name);
    args.push('-i', audioName);
    args.push('-filter_complex', filterComplex);
    args.push('-map', `[${videoLabel}]`, '-map', `[${audioLabel}]`);
    args.push('-r', String(quality.fps));
    args.push('-c:v', 'libx264', '-preset', quality.preset, '-crf', String(quality.crf));
    args.push('-pix_fmt', 'yuv420p');
    args.push('-c:a', 'aac', '-b:a', '160k');
    args.push('-movflags', '+faststart');
    args.push('-t', edl.totalDuration.toFixed(3));
    args.push('output.mp4');

    onLog?.(`ffmpeg ${args.join(' ')}`);
    await ffmpeg.exec(args);

    const data = await ffmpeg.readFile('output.mp4');
    const blob = new Blob([data.buffer], { type: 'video/mp4' });

    for (const name of clipNames) await ffmpeg.deleteFile(name).catch(() => {});
    await ffmpeg.deleteFile(audioName).catch(() => {});
    await ffmpeg.deleteFile('output.mp4').catch(() => {});

    return blob;
  } finally {
    ffmpeg.off('progress', progressHandler);
  }
}
