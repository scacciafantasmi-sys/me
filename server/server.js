// Minimal backend for the TikTok Auto Editor's "import from YouTube" feature.
//
// GitHub Pages (where the editor itself lives) can only serve static files —
// it cannot run yt-dlp or talk to YouTube on the server side. This tiny
// Express server is the one piece that has to run somewhere with real
// server-side execution (your own machine, Render, Railway, a VPS...). It
// does exactly one job: given a YouTube URL, download the video with
// yt-dlp and hand the resulting MP4 back to the browser, which then treats
// it exactly like a locally-uploaded clip — all beat-sync/scene-detection/
// rendering still happens client-side in the browser, nothing here touches
// that.
//
// Responsibility for what gets downloaded lies with whoever runs this
// server and whoever pastes a URL into it — only import videos you actually
// have the rights to use.

import express from 'express';
import cors from 'cors';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const PORT = Number(process.env.PORT) || 8787;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGIN || '*').split(',').map((s) => s.trim());
const MAX_DURATION_SECONDS = Number(process.env.MAX_DURATION_SECONDS) || 1800; // 30 min
const MAX_CONCURRENT_DOWNLOADS = Number(process.env.MAX_CONCURRENT_DOWNLOADS) || 2;
const JOB_TTL_MS = 30 * 60 * 1000; // jobs (and their temp files) are swept after 30 min
const TMP_DIR = path.join(os.tmpdir(), 'tiktok-auto-editor-yt');

await fsp.mkdir(TMP_DIR, { recursive: true });

const YOUTUBE_URL_RE = /^https?:\/\/(www\.|m\.|music\.)?(youtube\.com|youtube-nocookie\.com|youtu\.be)\//i;

const MIME_BY_EXT = {
  mp4: 'video/mp4', webm: 'video/webm', mkv: 'video/x-matroska',
  m4a: 'audio/mp4', mp3: 'audio/mpeg', opus: 'audio/opus', ogg: 'audio/ogg', aac: 'audio/aac',
};

/** @type {Map<string, {status:'downloading'|'ready'|'error', progress:number, title:string, error:string, filePath:string, ext:string, kind:'video'|'audio', createdAt:number}>} */
const jobs = new Map();
let activeDownloads = 0;

const app = express();
app.use(express.json());
app.use(cors({
  origin: ALLOWED_ORIGINS.includes('*') ? true : ALLOWED_ORIGINS,
}));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, activeDownloads, maxConcurrent: MAX_CONCURRENT_DOWNLOADS });
});

app.post('/api/youtube/start', (req, res) => {
  const url = String(req.body?.url || '').trim();
  const kind = req.body?.kind === 'audio' ? 'audio' : 'video';
  if (!YOUTUBE_URL_RE.test(url)) {
    return res.status(400).json({ error: 'Incolla un link YouTube valido (youtube.com o youtu.be).' });
  }
  if (activeDownloads >= MAX_CONCURRENT_DOWNLOADS) {
    return res.status(429).json({ error: 'Troppi download in corso sul server, riprova tra poco.' });
  }

  const jobId = randomUUID();
  const job = { status: 'downloading', progress: 0, title: '', error: '', filePath: '', ext: '', kind, createdAt: Date.now() };
  jobs.set(jobId, job);
  activeDownloads++;

  runDownload(jobId, url, job).finally(() => {
    activeDownloads = Math.max(0, activeDownloads - 1);
  });

  res.json({ jobId });
});

app.get('/api/youtube/status/:jobId', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job non trovato (scaduto o mai esistito).' });
  res.json({ status: job.status, progress: job.progress, title: job.title, ext: job.ext, error: job.error });
});

app.get('/api/youtube/file/:jobId', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job non trovato.' });
  if (job.status !== 'ready' || !job.filePath) return res.status(409).json({ error: 'Il file non è ancora pronto.' });

  const ext = job.ext || (job.kind === 'audio' ? 'm4a' : 'mp4');
  res.setHeader('Content-Type', MIME_BY_EXT[ext] || 'application/octet-stream');
  const safeName = (job.title || (job.kind === 'audio' ? 'audio' : 'video')).replace(/[^a-z0-9\-_ ]/gi, '_').slice(0, 60) || 'file';
  res.setHeader('Content-Disposition', `attachment; filename="${safeName}.${ext}"`);
  const stream = fs.createReadStream(job.filePath);
  stream.on('error', () => res.destroy());
  stream.pipe(res);
});

async function runDownload(jobId, url, job) {
  try {
    const outTemplate = path.join(TMP_DIR, `${jobId}__%(title).60s.%(ext)s`);
    const formatArgs = job.kind === 'audio'
      ? ['-f', 'bestaudio[ext=m4a]/bestaudio/best']
      : ['-f', 'bv*[ext=mp4][height<=1080]+ba[ext=m4a]/b[ext=mp4]/b', '--merge-output-format', 'mp4'];
    const args = [
      '--no-playlist',
      '--no-warnings',
      '--match-filter', `duration<${MAX_DURATION_SECONDS} & !is_live`,
      ...formatArgs,
      '--newline',
      '-o', outTemplate,
      url,
    ];

    let stderrTail = '';
    const exitCode = await new Promise((resolve, reject) => {
      const child = spawn('yt-dlp', args);
      child.stdout.on('data', (chunk) => {
        const text = chunk.toString();
        const m = /(\d+(?:\.\d+)?)%/.exec(text);
        if (m) job.progress = Math.min(0.99, parseFloat(m[1]) / 100);
      });
      child.stderr.on('data', (chunk) => {
        stderrTail = (stderrTail + chunk.toString()).slice(-4000);
      });
      child.on('error', reject);
      child.on('close', resolve);
    });

    if (exitCode !== 0) {
      job.status = 'error';
      job.error = summarizeYtDlpError(stderrTail) || 'Download fallito.';
      return;
    }

    const files = (await fsp.readdir(TMP_DIR)).filter((f) => f.startsWith(`${jobId}__`));
    if (files.length === 0) {
      job.status = 'error';
      job.error = 'Il download è terminato ma il file non è stato trovato.';
      return;
    }
    const fileName = files[0];
    job.filePath = path.join(TMP_DIR, fileName);
    const titleMatch = /^.+?__(.+)\.([^.]+)$/.exec(fileName);
    job.title = titleMatch ? titleMatch[1] : (job.kind === 'audio' ? 'audio' : 'video');
    job.ext = (titleMatch ? titleMatch[2] : (job.kind === 'audio' ? 'm4a' : 'mp4')).toLowerCase();
    job.progress = 1;
    job.status = 'ready';
  } catch (err) {
    job.status = 'error';
    job.error = err?.code === 'ENOENT'
      ? 'yt-dlp non è installato su questo server.'
      : `Errore interno: ${err?.message || err}`;
  }
}

function summarizeYtDlpError(stderrTail) {
  if (/match-?filter/i.test(stderrTail) || /does not pass filter/i.test(stderrTail)) {
    return `Il video supera il limite di durata consentito (${Math.round(MAX_DURATION_SECONDS / 60)} minuti) o è una diretta live.`;
  }
  if (/Private video|Sign in/i.test(stderrTail)) return 'Il video è privato o richiede accesso.';
  if (/Video unavailable/i.test(stderrTail)) return 'Video non disponibile.';
  const lastLine = stderrTail.trim().split('\n').pop();
  return lastLine ? `Errore yt-dlp: ${lastLine.slice(0, 300)}` : 'Errore sconosciuto durante il download.';
}

// Periodic sweep: delete stale jobs and their temp files so disk/memory don't grow unbounded.
setInterval(async () => {
  const now = Date.now();
  for (const [jobId, job] of jobs) {
    if (now - job.createdAt > JOB_TTL_MS) {
      jobs.delete(jobId);
      if (job.filePath) await fsp.unlink(job.filePath).catch(() => {});
    }
  }
}, 5 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`TikTok Auto Editor YouTube import server listening on :${PORT}`);
});
