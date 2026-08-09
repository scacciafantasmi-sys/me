import { analyzeAudioFile } from './beatDetector.js';
import { buildEDL } from './edl.js';
import { renderEdit } from './ffmpegEngine.js';
import { detectSceneCuts, cutsToWindows } from './sceneDetect.js';
import { Waveform, CLIP_COLORS } from './waveform.js';

const $ = (sel) => document.querySelector(sel);

const audioDrop = $('#audio-drop');
const audioInput = $('#audio-input');
const audioInfo = $('#audio-info');
const audioName = $('#audio-name');
const audioBpm = $('#audio-bpm');
const rangeReadout = $('#range-readout');
const waveformCanvas = $('#waveform');
const rangeStartInput = $('#range-start-input');
const rangeEndInput = $('#range-end-input');

const clipsDrop = $('#clips-drop');
const clipsInput = $('#clips-input');
const clipsList = $('#clips-list');
const clipsWarning = $('#clips-warning');

const ytBackendInput = $('#yt-backend-input');
const ytUrlInput = $('#yt-url-input');
const ytImportBtn = $('#yt-import-btn');
const ytStatus = $('#yt-status');

const audioYtBackendInput = $('#audio-yt-backend-input');
const audioYtUrlInput = $('#audio-yt-url-input');
const audioYtImportBtn = $('#audio-yt-import-btn');
const audioYtStatus = $('#audio-yt-status');

const generateBtn = $('#generate-btn');
const paceSelect = $('#pace-select');
const styleSelect = $('#style-select');
const aspectSelect = $('#aspect-select');
const qualitySelect = $('#quality-select');

const renderSection = $('#render-section');
const progressFill = $('#progress-fill');
const renderStatus = $('#render-status');
const ffmpegLog = $('#ffmpeg-log');

const outputSection = $('#output-section');
const outputVideo = $('#output-video');
const downloadLink = $('#download-link');
const regenerateBtn = $('#regenerate-btn');

const waveform = new Waveform(waveformCanvas);

const SPLIT_THRESHOLD_SECONDS = 6;
const AUTO_SPLIT_MIN_SECONDS = 20; // long imports (scene packs) get auto-split without asking
const BACKEND_URL_STORAGE_KEY = 'tiktokAutoEditor.backendUrl';

let audioFile = null;
let audioAnalysis = null;

/** One physical uploaded/imported video file. @type {{id:number, file:File, duration:number}[]} */
let sources = [];
let sourceIdSeq = 0;

/**
 * One row the user sees/reorders: a window into some source's footage.
 * Several scenes can share the same sourceId (auto-split from one long video).
 * @type {{id:number, sourceId:number, windowStart:number, windowEnd:number, label:string, thumb:string|null, splitting:boolean, el:HTMLLIElement}[]}
 */
let scenes = [];
let sceneIdSeq = 0;

let currentOutputUrl = null;

function fmtTime(s) {
  s = Math.max(0, s);
  const m = Math.floor(s / 60);
  const sec = (s - m * 60).toFixed(1);
  return `${m}:${sec.padStart(4, '0')}`;
}

function fmtMMSS(s) {
  s = Math.max(0, Math.round(s));
  const m = Math.floor(s / 60);
  const sec = s - m * 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

/** Accepts "1:23", "83" or "1:23.5" and returns seconds, or null if unparseable. */
function parseTimeInput(str) {
  str = (str || '').trim();
  if (!str) return null;
  const parts = str.split(':');
  if (parts.length === 2) {
    const m = parseFloat(parts[0]);
    const s = parseFloat(parts[1]);
    if (Number.isNaN(m) || Number.isNaN(s)) return null;
    return m * 60 + s;
  }
  const v = parseFloat(str);
  return Number.isNaN(v) ? null : v;
}

function updateGenerateEnabled() {
  generateBtn.disabled = !(audioAnalysis && scenes.length > 0);
}

// ---------- Audio ----------

function setupDropzone(zone, input, onFiles) {
  zone.addEventListener('click', () => input.click());
  zone.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') input.click(); });
  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('dragover');
    onFiles(e.dataTransfer.files);
  });
  input.addEventListener('change', () => { onFiles(input.files); input.value = ''; });
}

function commitRangeStart() {
  if (!audioAnalysis) return;
  const v = parseTimeInput(rangeStartInput.value);
  const range = waveform.getRange();
  if (v == null) { rangeStartInput.value = fmtMMSS(range.start); return; }
  waveform.setRange(v, range.end);
}

function commitRangeEnd() {
  if (!audioAnalysis) return;
  const v = parseTimeInput(rangeEndInput.value);
  const range = waveform.getRange();
  if (v == null) { rangeEndInput.value = fmtMMSS(range.end); return; }
  waveform.setRange(range.start, v);
}

rangeStartInput.addEventListener('change', commitRangeStart);
rangeStartInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') rangeStartInput.blur(); });
rangeEndInput.addEventListener('change', commitRangeEnd);
rangeEndInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') rangeEndInput.blur(); });

async function loadAudioFile(file) {
  audioFile = file;
  audioName.textContent = file.name;
  audioInfo.classList.remove('hidden');
  audioBpm.textContent = 'Analisi…';
  try {
    audioAnalysis = await analyzeAudioFile(file, (msg) => { audioBpm.textContent = msg; });
    audioBpm.textContent = `${Math.round(audioAnalysis.bpm)} BPM`;
    waveform.setAudio(audioAnalysis);
    waveform.onRangeChange = (range) => {
      rangeReadout.textContent = `${fmtTime(range.start)} — ${fmtTime(range.end)} (${fmtTime(range.end - range.start)})`;
      rangeStartInput.value = fmtMMSS(range.start);
      rangeEndInput.value = fmtMMSS(range.end);
    };
    waveform.onRangeChange(waveform.getRange());
  } catch (err) {
    console.error(err);
    audioBpm.textContent = 'Errore nell\'analisi audio';
  }
  updateGenerateEnabled();
}

setupDropzone(audioDrop, audioInput, async (files) => {
  const file = files?.[0];
  if (file) await loadAudioFile(file);
});

// ---------- Clips / scenes ----------

function captureThumb(file, atTime = 0.3) {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    const url = URL.createObjectURL(file);
    video.src = url;
    let settled = false;
    const finish = (duration, thumb) => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(url);
      resolve({ duration, thumb });
    };
    video.addEventListener('loadedmetadata', () => {
      const duration = video.duration;
      if (!isFinite(duration) || duration <= 0) { finish(0, null); return; }
      video.currentTime = Math.min(Math.max(0, atTime), Math.max(0, duration - 0.05));
    });
    video.addEventListener('seeked', () => {
      try {
        const canvas = document.createElement('canvas');
        const w = 80, h = Math.round((video.videoHeight / video.videoWidth) * 80) || 80;
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(video, 0, 0, w, h);
        finish(video.duration, canvas.toDataURL('image/jpeg', 0.7));
      } catch {
        finish(video.duration, null);
      }
    });
    video.addEventListener('error', () => finish(0, null));
    setTimeout(() => finish(video.duration || 0, null), 4000);
  });
}

function sourceById(id) {
  return sources.find((s) => s.id === id);
}

function sourceOf(scene) {
  return sourceById(scene.sourceId);
}

function renderSceneRow(scene, index) {
  const li = scene.el;
  li.className = 'clip-row';
  li.draggable = true;
  li.dataset.id = String(scene.id);
  const color = CLIP_COLORS[index % CLIP_COLORS.length];
  const duration = scene.windowEnd - scene.windowStart;
  const source = sourceOf(scene);
  const canSplit = duration > SPLIT_THRESHOLD_SECONDS;
  li.innerHTML = `
    <span class="clip-swatch" style="background:${color}"></span>
    <span class="clip-thumb">${scene.thumb ? `<img src="${scene.thumb}" alt="">` : ''}</span>
    <span class="clip-meta">
      <strong>${source?.file.name || '…'}${scene.label ? ` <span class="clip-scene-label">${scene.label}</span>` : ''}</strong>
      <span class="clip-duration">${duration ? duration.toFixed(1) + 's' : '…'}</span>
    </span>
    ${canSplit ? `<button class="clip-split" title="Dividi automaticamente in scene" ${scene.splitting ? 'disabled' : ''}>${scene.splitting ? '…' : '✂️'}</button>` : ''}
    <button class="clip-remove" title="Rimuovi" aria-label="Rimuovi scena">✕</button>
  `;
  li.querySelector('.clip-remove').addEventListener('click', () => removeScene(scene.id));
  li.querySelector('.clip-split')?.addEventListener('click', () => splitScene(scene.id));
}

function renderScenesList() {
  clipsList.innerHTML = '';
  scenes.forEach((scene, i) => { renderSceneRow(scene, i); clipsList.appendChild(scene.el); });
  const totalBytes = sources.reduce((s, src) => s + src.file.size, 0);
  if (totalBytes > 300 * 1024 * 1024) {
    clipsWarning.textContent = `Attenzione: ${(totalBytes / 1024 / 1024).toFixed(0)}MB totali di video possono rallentare molto il rendering nel browser.`;
    clipsWarning.classList.remove('hidden');
  } else {
    clipsWarning.classList.add('hidden');
  }
}

function removeScene(id) {
  scenes = scenes.filter((s) => s.id !== id);
  renderScenesList();
  updateGenerateEnabled();
}

/** Adds a new source file + one scene spanning it entirely. Returns the created scene. */
async function addSource(file) {
  const source = { id: sourceIdSeq++, file, duration: 0 };
  sources.push(source);
  const scene = { id: sceneIdSeq++, sourceId: source.id, windowStart: 0, windowEnd: 0, label: '', thumb: null, splitting: false, el: document.createElement('li') };
  scenes.push(scene);
  renderScenesList();
  updateGenerateEnabled();
  const { duration, thumb } = await captureThumb(file);
  source.duration = duration;
  scene.windowEnd = duration;
  scene.thumb = thumb;
  renderScenesList();
  updateGenerateEnabled();
  return scene;
}

async function addClipFiles(fileList) {
  const files = Array.from(fileList || []).filter((f) => f.type.startsWith('video/'));
  for (const file of files) await addSource(file);
}

setupDropzone(clipsDrop, clipsInput, addClipFiles);

/** Runs scene detection on the given scene's source and replaces it with N scene windows. */
async function splitScene(sceneId) {
  const scene = scenes.find((s) => s.id === sceneId);
  if (!scene || scene.splitting) return;
  const source = sourceOf(scene);
  if (!source) return;
  scene.splitting = true;
  renderScenesList();
  try {
    const cuts = await detectSceneCuts(source.file);
    const windows = cutsToWindows(cuts, source.duration);
    if (windows.length <= 1) return; // nothing meaningful detected, leave as-is
    const idx = scenes.indexOf(scene);
    const newScenes = windows.map((w, i) => ({
      id: sceneIdSeq++,
      sourceId: source.id,
      windowStart: w.start,
      windowEnd: w.end,
      label: `scena ${i + 1}/${windows.length}`,
      thumb: null,
      splitting: false,
      el: document.createElement('li'),
    }));
    scenes.splice(idx, 1, ...newScenes);
    renderScenesList();
    updateGenerateEnabled();
    for (const s of newScenes) {
      const { thumb } = await captureThumb(source.file, s.windowStart + Math.min(0.3, (s.windowEnd - s.windowStart) / 2));
      s.thumb = thumb;
      renderScenesList();
    }
  } catch (err) {
    console.error(err);
    scene.splitting = false;
    renderScenesList();
  }
}

let dragSrcId = null;
clipsList.addEventListener('dragstart', (e) => {
  const row = e.target.closest('.clip-row');
  if (!row) return;
  dragSrcId = Number(row.dataset.id);
  e.dataTransfer.effectAllowed = 'move';
});
clipsList.addEventListener('dragover', (e) => {
  e.preventDefault();
  const row = e.target.closest('.clip-row');
  if (!row) return;
  row.classList.add('drag-over');
});
clipsList.addEventListener('dragleave', (e) => {
  const row = e.target.closest('.clip-row');
  row?.classList.remove('drag-over');
});
clipsList.addEventListener('drop', (e) => {
  e.preventDefault();
  const row = e.target.closest('.clip-row');
  row?.classList.remove('drag-over');
  if (!row || dragSrcId == null) return;
  const targetId = Number(row.dataset.id);
  if (targetId === dragSrcId) return;
  const srcIdx = scenes.findIndex((s) => s.id === dragSrcId);
  const tgtIdx = scenes.findIndex((s) => s.id === targetId);
  const [moved] = scenes.splice(srcIdx, 1);
  scenes.splice(tgtIdx, 0, moved);
  dragSrcId = null;
  renderScenesList();
});

// ---------- YouTube import ----------

function syncBackendInputs(value) {
  ytBackendInput.value = value;
  audioYtBackendInput.value = value;
}

function bindBackendInput(input) {
  input.addEventListener('change', () => {
    const value = input.value.trim();
    localStorage.setItem(BACKEND_URL_STORAGE_KEY, value);
    syncBackendInputs(value);
  });
}

syncBackendInputs(localStorage.getItem(BACKEND_URL_STORAGE_KEY) || '');
bindBackendInput(ytBackendInput);
bindBackendInput(audioYtBackendInput);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Starts a YouTube download job on the backend, polls it to completion and
 * returns the downloaded file. `kind` is 'video' or 'audio' (audio-only
 * extraction, used for importing just the song).
 */
async function fetchYoutubeFile({ backendUrl, url, kind, onStatus }) {
  const startResp = await fetch(`${backendUrl}/api/youtube/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, kind }),
  });
  const startData = await startResp.json().catch(() => ({}));
  if (!startResp.ok) throw new Error(startData.error || `Errore del server (${startResp.status})`);
  const { jobId } = startData;

  let job = null;
  const deadline = Date.now() + 10 * 60 * 1000;
  while (Date.now() < deadline) {
    await sleep(1200);
    const statusResp = await fetch(`${backendUrl}/api/youtube/status/${jobId}`);
    const statusData = await statusResp.json().catch(() => ({}));
    if (!statusResp.ok) throw new Error(statusData.error || `Errore del server (${statusResp.status})`);
    job = statusData;
    if (job.status === 'downloading') {
      onStatus?.(`Scaricamento da YouTube… ${Math.round((job.progress || 0) * 100)}%`);
    } else if (job.status === 'ready' || job.status === 'error') {
      break;
    }
  }
  if (!job || job.status === 'downloading') throw new Error('Timeout: il download sta impiegando troppo tempo.');
  if (job.status === 'error') throw new Error(job.error || 'Download fallito.');

  onStatus?.(kind === 'audio' ? 'Trasferimento dell\'audio nel browser…' : 'Trasferimento del video nel browser…');
  const fileResp = await fetch(`${backendUrl}/api/youtube/file/${jobId}`);
  if (!fileResp.ok) throw new Error('Impossibile scaricare il file dal server.');
  const blob = await fileResp.blob();
  const ext = job.ext || (kind === 'audio' ? 'm4a' : 'mp4');
  const fileName = `${(job.title || (kind === 'audio' ? 'audio' : 'video')).replace(/[^a-z0-9\-_ ]/gi, '_').slice(0, 60)}.${ext}`;
  const file = new File([blob], fileName, { type: blob.type || (kind === 'audio' ? 'audio/mp4' : 'video/mp4') });
  return { file, fileName };
}

/** Shows a status line with a visible color/background so it can't be missed as "nothing happened". */
function setYtStatus(el, text, kind = 'info') {
  el.textContent = text;
  el.className = text ? `hint yt-status-msg ${kind}` : 'hint';
}

function requireBackendAndUrl(backendInput, urlInput, statusEl) {
  const backendUrl = backendInput.value.trim().replace(/\/+$/, '');
  const url = urlInput.value.trim();
  if (!backendUrl) {
    setYtStatus(statusEl, 'Imposta prima l\'URL del server di importazione (vedi server/README.md).', 'error');
    return null;
  }
  if (!url) {
    setYtStatus(statusEl, 'Incolla un link YouTube.', 'error');
    return null;
  }
  return { backendUrl, url };
}

async function importFromYouTube() {
  const params = requireBackendAndUrl(ytBackendInput, ytUrlInput, ytStatus);
  if (!params) return;

  ytImportBtn.disabled = true;
  setYtStatus(ytStatus, 'Avvio del download…', 'info');

  try {
    const { file, fileName } = await fetchYoutubeFile({
      ...params,
      kind: 'video',
      onStatus: (msg) => setYtStatus(ytStatus, msg, 'info'),
    });

    setYtStatus(ytStatus, 'Analisi del video importato…', 'info');
    const scene = await addSource(file);

    const source = sourceOf(scene);
    if (source.duration >= AUTO_SPLIT_MIN_SECONDS) {
      setYtStatus(ytStatus, 'Rilevamento automatico delle scene in corso…', 'info');
      await splitScene(scene.id);
      const count = scenes.filter((s) => s.sourceId === source.id).length;
      setYtStatus(ytStatus, `Importato "${fileName}": ${count} scene rilevate.`, 'success');
    } else {
      setYtStatus(ytStatus, `Importato "${fileName}".`, 'success');
    }
    ytUrlInput.value = '';
  } catch (err) {
    console.error(err);
    setYtStatus(ytStatus, `Errore: ${err.message || err}`, 'error');
  } finally {
    ytImportBtn.disabled = false;
  }
}

async function importAudioFromYouTube() {
  const params = requireBackendAndUrl(audioYtBackendInput, audioYtUrlInput, audioYtStatus);
  if (!params) return;

  audioYtImportBtn.disabled = true;
  setYtStatus(audioYtStatus, 'Avvio del download…', 'info');

  try {
    const { file, fileName } = await fetchYoutubeFile({
      ...params,
      kind: 'audio',
      onStatus: (msg) => setYtStatus(audioYtStatus, msg, 'info'),
    });

    setYtStatus(audioYtStatus, 'Analisi del ritmo…', 'info');
    await loadAudioFile(file);
    setYtStatus(audioYtStatus, `Importato "${fileName}".`, 'success');
    audioYtUrlInput.value = '';
  } catch (err) {
    console.error(err);
    setYtStatus(audioYtStatus, `Errore: ${err.message || err}`, 'error');
  } finally {
    audioYtImportBtn.disabled = false;
  }
}

ytImportBtn.addEventListener('click', importFromYouTube);
ytUrlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') importFromYouTube(); });
audioYtImportBtn.addEventListener('click', importAudioFromYouTube);
audioYtUrlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') importAudioFromYouTube(); });

// ---------- Generate ----------

function computeSize(aspect, quality) {
  if (aspect === '9:16') return quality === '1080' ? { width: 1080, height: 1920 } : { width: 720, height: 1280 };
  if (aspect === '16:9') return quality === '1080' ? { width: 1920, height: 1080 } : { width: 1280, height: 720 };
  return quality === '1080' ? { width: 1080, height: 1080 } : { width: 720, height: 720 };
}

async function generate() {
  if (!audioAnalysis || scenes.length === 0) return;
  generateBtn.disabled = true;
  renderSection.classList.remove('hidden');
  outputSection.classList.add('hidden');
  ffmpegLog.textContent = '';
  progressFill.style.width = '0%';
  renderStatus.textContent = 'Costruzione del piano di montaggio…';
  renderSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

  try {
    // Dedup source files: several scenes may share the same underlying file
    // (auto-split), each unique source is only ever handed to ffmpeg once.
    const usedSourceIds = [...new Set(scenes.map((s) => s.sourceId))];
    const sourceFiles = usedSourceIds.map((id) => sourceById(id).file);
    const edlScenes = scenes.map((s) => ({
      duration: s.windowEnd - s.windowStart,
      sourceIndex: usedSourceIds.indexOf(s.sourceId),
      windowStart: s.windowStart,
    }));

    const range = waveform.getRange();
    const edl = buildEDL({
      beatInfo: audioAnalysis,
      scenes: edlScenes,
      songRange: { start: range.start, end: range.end },
      pace: paceSelect.value,
      stylePool: styleSelect.value,
    });
    waveform.setEDL(edl);

    const { width, height } = computeSize(aspectSelect.value, qualitySelect.value);
    renderStatus.textContent = 'Rendering in corso nel browser (può richiedere qualche minuto)…';

    const blob = await renderEdit({
      edl,
      sourceFiles,
      audioFile,
      quality: { width, height, fps: 30, crf: qualitySelect.value === '1080' ? 24 : 23, preset: 'veryfast' },
      onProgress: (ratio) => {
        progressFill.style.width = `${Math.round(ratio * 100)}%`;
        renderStatus.textContent = `Rendering… ${Math.round(ratio * 100)}%`;
      },
      onLog: (msg) => {
        ffmpegLog.textContent += msg + '\n';
        ffmpegLog.scrollTop = ffmpegLog.scrollHeight;
      },
    });

    if (currentOutputUrl) URL.revokeObjectURL(currentOutputUrl);
    currentOutputUrl = URL.createObjectURL(blob);
    outputVideo.src = currentOutputUrl;
    downloadLink.href = currentOutputUrl;
    progressFill.style.width = '100%';
    renderStatus.textContent = `Fatto! Durata: ${edl.totalDuration.toFixed(1)}s, ${edl.segments.length} tagli a ${Math.round(edl.bpm)} BPM.`;
    outputSection.classList.remove('hidden');
    outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
    console.error(err);
    renderStatus.textContent = `Errore: ${err.message || err}`;
  } finally {
    generateBtn.disabled = false;
  }
}

generateBtn.addEventListener('click', generate);
regenerateBtn.addEventListener('click', generate);
