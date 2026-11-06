// Free text-to-speech route for your Remotion render server (no API key, no GPU).
// Uses the Microsoft Edge "Read Aloud" voices through the `msedge-tts` package.
//
// Setup in the render-server project:
//   1. npm i msedge-tts
//   2. copy this file to server/tts.ts
//   3. in server/index.ts:   import {registerTts} from './tts';
//                            registerTts(app);        // before app.listen(...)
//
// POST /tts  {"text": "...", "voice": "en-US-AndrewNeural"}
//   -> {"path": "/voice/<id>.mp3"}   (the file is served from GET /voice/<id>.mp3)
//
// Note: this is Microsoft's unofficial, free endpoint. It works without a key but
// has no SLA and could change, so keep the voice generation behind this one route
// (swapping to Piper or Kokoro later only means changing this file).
import express, {type Express} from 'express';
import {MsEdgeTTS, OUTPUT_FORMAT} from 'msedge-tts';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const DIR = path.join(os.tmpdir(), 'voice');
fs.mkdirSync(DIR, {recursive: true});

const MAX_CHARS = 600;
const KEEP_MS = 6 * 60 * 60 * 1000; // delete clips after 6 h
const VOICE_RE = /^[a-z]{2,3}-[A-Z]{2}-[A-Za-z]+Neural$/;

const escapeXml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

// One synthesis at a time keeps the free endpoint happy.
let chain: Promise<unknown> = Promise.resolve();
const enqueue = <T,>(fn: () => Promise<T>): Promise<T> => {
  const run = chain.then(fn, fn);
  chain = run.catch(() => undefined);
  return run;
};

const cleanup = () => {
  const now = Date.now();
  for (const f of fs.readdirSync(DIR)) {
    const p = path.join(DIR, f);
    try {
      if (now - fs.statSync(p).mtimeMs > KEEP_MS) fs.unlinkSync(p);
    } catch {
      /* ignore */
    }
  }
};

const synth = async (text: string, voice: string, file: string) => {
  const tts = new MsEdgeTTS({connectionTimeoutMs: 10000, synthesisTimeoutMs: 60000});
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  const {audioStream} = tts.toStream(escapeXml(text));
  await new Promise<void>((resolve, reject) => {
    const out = fs.createWriteStream(file);
    audioStream.on('error', reject);
    out.on('error', reject);
    out.on('finish', () => resolve());
    audioStream.pipe(out);
  });
  (tts as unknown as {close?: () => void}).close?.();
};

export function registerTts(app: Express) {
  app.use('/voice', (_req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
  });
  app.use('/voice', express.static(DIR, {maxAge: '1h'}));

  app.post('/tts', express.json({limit: '50kb'}), async (req, res) => {
    const text = String(req.body?.text ?? '').trim();
    const voice = String(req.body?.voice ?? 'en-US-AndrewNeural');

    if (!text) return res.status(400).json({error: 'text is required'});
    if (text.length > MAX_CHARS) {
      return res.status(400).json({error: `text is longer than ${MAX_CHARS} characters`});
    }
    if (!VOICE_RE.test(voice)) return res.status(400).json({error: 'invalid voice name'});

    const id = crypto.randomUUID();
    const file = path.join(DIR, `${id}.mp3`);
    try {
      cleanup();
      await enqueue(() => synth(text, voice, file));
      const size = fs.statSync(file).size;
      if (size < 1000) throw new Error('empty audio returned');
      return res.json({path: `/voice/${id}.mp3`});
    } catch (e) {
      try {
        fs.unlinkSync(file);
      } catch {
        /* ignore */
      }
      return res.status(502).json({error: e instanceof Error ? e.message : String(e)});
    }
  });
}
