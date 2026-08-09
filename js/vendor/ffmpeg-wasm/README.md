# Vendored `@ffmpeg/ffmpeg` (dist/esm)

Files: `index.js`, `classes.js`, `const.js`, `errors.js`, `types.js`, `utils.js`, `worker.js` — unmodified `dist/esm` build from [`@ffmpeg/ffmpeg`](https://www.npmjs.com/package/@ffmpeg/ffmpeg) v0.12.15 (MIT license, © ffmpeg.wasm contributors).

## Why these files are committed here instead of loaded from a CDN

`FFmpeg.load()` creates a Web Worker at a URL resolved relative to this package's own `import.meta.url`. Browsers refuse to construct a `Worker` whose script lives on a different origin than the page (unrelated to CORS — it's a hard same-origin requirement on the `Worker` constructor itself), so loading this package from a CDN like jsDelivr throws a `SecurityError` and the render never starts.

Turning the worker script into a `blob:` URL (the usual same-origin workaround) doesn't work either: `worker.js` itself does `import "./const.js"` and `import "./errors.js"`, and relative imports can't be resolved against a `blob:` URL as a base — the module graph fails to load and the worker dies silently before it ever registers a message handler, which just hangs the app forever with no error.

Self-hosting the whole small `dist/esm` folder (only ~16KB total) sidesteps both problems: `import.meta.url` is now same-origin, so the default (unconfigured) worker URL resolves correctly and its own relative imports resolve correctly too.

The actual ffmpeg core (`ffmpeg-core.js` + `ffmpeg-core.wasm`, ~30MB) is *not* vendored — it's still fetched from jsDelivr and turned into a `blob:` URL at runtime (see `js/ffmpegEngine.js`), which is fine because it's loaded via `import()` from inside the (now same-origin) worker, not used to construct a `Worker`.

To update: download `@ffmpeg/ffmpeg`'s `dist/esm/*.js` for the target version and replace these files as-is (no edits needed).
