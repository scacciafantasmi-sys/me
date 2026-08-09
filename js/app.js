import { analyzeAudioFile } from './beatDetector.js';
import { buildEDL } from './edl.js';
import { renderEdit } from './ffmpegEngine.js';
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

let audioFile = null;
let audioAnalysis = null;
/** @type {{id:number, file:File, duration:number, thumb:string|null, el:HTMLLIElement}[]} */
let clips = [];
let clipIdSeq = 0;
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
  generateBtn.disabled = !(audioAnalysis && clips.length > 0);
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

setupDropzone(audioDrop, audioInput, async (files) => {
  const file = files?.[0];
  if (!file) return;
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
});

// ---------- Clips ----------

function captureThumb(file) {
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
      video.currentTime = Math.min(0.3, duration / 2);
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

function renderClipRow(clip, index) {
  const li = clip.el;
  li.className = 'clip-row';
  li.draggable = true;
  li.dataset.id = String(clip.id);
  const color = CLIP_COLORS[index % CLIP_COLORS.length];
  li.innerHTML = `
    <span class="clip-swatch" style="background:${color}"></span>
    <span class="clip-thumb">${clip.thumb ? `<img src="${clip.thumb}" alt="">` : ''}</span>
    <span class="clip-meta">
      <strong>${clip.file.name}</strong>
      <span class="clip-duration">${clip.duration ? clip.duration.toFixed(1) + 's' : '…'}</span>
    </span>
    <button class="clip-remove" title="Rimuovi" aria-label="Rimuovi clip">✕</button>
  `;
  li.querySelector('.clip-remove').addEventListener('click', () => removeClip(clip.id));
}

function renderClipsList() {
  clipsList.innerHTML = '';
  clips.forEach((clip, i) => { renderClipRow(clip, i); clipsList.appendChild(clip.el); });
  const totalBytes = clips.reduce((s, c) => s + c.file.size, 0);
  if (totalBytes > 300 * 1024 * 1024) {
    clipsWarning.textContent = `Attenzione: ${(totalBytes / 1024 / 1024).toFixed(0)}MB totali di video possono rallentare molto il rendering nel browser.`;
    clipsWarning.classList.remove('hidden');
  } else {
    clipsWarning.classList.add('hidden');
  }
}

function removeClip(id) {
  clips = clips.filter((c) => c.id !== id);
  renderClipsList();
  updateGenerateEnabled();
}

async function addClipFiles(fileList) {
  const files = Array.from(fileList || []).filter((f) => f.type.startsWith('video/'));
  for (const file of files) {
    const clip = { id: clipIdSeq++, file, duration: 0, thumb: null, el: document.createElement('li') };
    clips.push(clip);
    renderClipsList();
    updateGenerateEnabled();
    const { duration, thumb } = await captureThumb(file);
    clip.duration = duration;
    clip.thumb = thumb;
    renderClipsList();
    updateGenerateEnabled();
  }
}

setupDropzone(clipsDrop, clipsInput, addClipFiles);

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
  const srcIdx = clips.findIndex((c) => c.id === dragSrcId);
  const tgtIdx = clips.findIndex((c) => c.id === targetId);
  const [moved] = clips.splice(srcIdx, 1);
  clips.splice(tgtIdx, 0, moved);
  dragSrcId = null;
  renderClipsList();
});

// ---------- Generate ----------

function computeSize(aspect, quality) {
  if (aspect === '9:16') return quality === '1080' ? { width: 1080, height: 1920 } : { width: 720, height: 1280 };
  if (aspect === '16:9') return quality === '1080' ? { width: 1920, height: 1080 } : { width: 1280, height: 720 };
  return quality === '1080' ? { width: 1080, height: 1080 } : { width: 720, height: 720 };
}

async function generate() {
  if (!audioAnalysis || clips.length === 0) return;
  generateBtn.disabled = true;
  renderSection.classList.remove('hidden');
  outputSection.classList.add('hidden');
  ffmpegLog.textContent = '';
  progressFill.style.width = '0%';
  renderStatus.textContent = 'Costruzione del piano di montaggio…';
  renderSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

  try {
    const range = waveform.getRange();
    const edl = buildEDL({
      beatInfo: audioAnalysis,
      clips: clips.map((c) => ({ duration: c.duration })),
      songRange: { start: range.start, end: range.end },
      pace: paceSelect.value,
      stylePool: styleSelect.value,
    });
    waveform.setEDL(edl);

    const { width, height } = computeSize(aspectSelect.value, qualitySelect.value);
    renderStatus.textContent = 'Rendering in corso nel browser (può richiedere qualche minuto)…';

    const blob = await renderEdit({
      edl,
      clipFiles: clips.map((c) => c.file),
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
