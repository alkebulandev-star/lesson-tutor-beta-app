/*  Simple local dev server — serves static files + proxies API calls
    Run:  node local-server.js
    Open: http://localhost:3000/app/
*/
import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── Load .env.local ──
const envPath = join(__dirname, '.env.local');
if (existsSync(envPath)) {
  readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    const eq = line.indexOf('=');
    if (eq > 0) process.env[line.slice(0, eq)] = line.slice(eq + 1);
  });
}

const PORT = 3000;
const PUBLIC = join(__dirname, 'public');

const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4', '.wav': 'audio/wav', '.mp3': 'audio/mpeg',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf',
  '.ico': 'image/x-icon', '.webp': 'image/webp',
};

// ── API: ElevenLabs proxy ──
async function handleElevenLabs(req, res) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return jsonErr(res, 500, 'ELEVENLABS_API_KEY not set in .env.local');

  const body = await readBody(req);
  const { text, voiceId, languageCode } = JSON.parse(body);
  if (!text) return jsonErr(res, 400, 'Missing text');

  const vid = voiceId || 'CiGXiF6vr3ULNlgVfZ5z';
  const payload = {
    text: text.slice(0, 4000),
    model_id: 'eleven_multilingual_v2',
    voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.4, use_speaker_boost: true },
  };
  if (languageCode) payload.language_code = languageCode;

  try {
    const upstream = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${vid}?output_format=mp3_44100_128`,
      { method: 'POST', headers: { 'xi-api-key': key, 'content-type': 'application/json' }, body: JSON.stringify(payload) }
    );
    if (!upstream.ok) {
      const detail = await upstream.text();
      return jsonErr(res, upstream.status, `ElevenLabs ${upstream.status}: ${detail}`);
    }
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.writeHead(200, { 'content-type': 'audio/mpeg', 'cache-control': 'no-store' });
    res.end(buf);
  } catch (e) {
    jsonErr(res, 502, e.message);
  }
}

// ── API: Anthropic proxy — routes through OpenAI (Anthropic account has no model access) ──
async function handleAnthropic(req, res) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return jsonErr(res, 500, 'OPENAI_API_KEY not set in .env.local');

  const body = await readBody(req);
  const payload = JSON.parse(body);

  // Convert Anthropic request format → OpenAI format
  // Anthropic puts system prompt as top-level field; OpenAI puts it in messages
  const oaiMessages = [];
  if (payload.system) {
    oaiMessages.push({ role: 'system', content: String(payload.system) });
  }
  (payload.messages || []).forEach(m => {
    // Handle multimodal content (images, documents)
    let content = m.content;
    if (Array.isArray(content)) {
      const parts = [];
      content.forEach(b => {
        if (b.type === 'text') parts.push({ type: 'text', text: b.text || '' });
        else if (b.type === 'image' && b.source?.type === 'base64') {
          parts.push({ type: 'image_url', image_url: { url: 'data:' + b.source.media_type + ';base64,' + b.source.data } });
        }
      });
      content = parts.length === 1 && parts[0].type === 'text' ? parts[0].text : parts;
    }
    oaiMessages.push({ role: m.role, content: content });
  });

  const sysPreview = oaiMessages[0]?.role === 'system' ? oaiMessages[0].content.slice(0, 100) : '(no system)';
  console.log(`  → Anthropic proxy: ${oaiMessages.length} msgs, max_tokens=${payload.max_tokens || 1024}, system: "${sysPreview}..."`);

  try {
    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: oaiMessages,
        max_tokens: Math.min(payload.max_tokens || 1024, 16384),
      }),
    });
    if (!upstream.ok) {
      const detail = await upstream.text();
      return jsonErr(res, upstream.status, detail);
    }
    const data = await upstream.json();
    const text = data.choices?.[0]?.message?.content || '';
    // Log response for debugging
    const hasMarkers = text.includes('<<<OPENING>>>');
    console.log(`  ← Response: ${text.length} chars, has <<<OPENING>>>: ${hasMarkers}`);
    if (!hasMarkers) console.log(`  ← First 500 chars: ${text.slice(0, 500).replace(/\n/g, '\\n')}`);
    // Return in Anthropic API format so the app can parse it
    const anthropicShape = {
      id: 'msg-' + Date.now(),
      type: 'message',
      role: 'assistant',
      model: 'gpt-4o',
      content: [{ type: 'text', text: text }],
      stop_reason: data.choices?.[0]?.finish_reason || 'end_turn',
      usage: {
        input_tokens: data.usage?.prompt_tokens || 0,
        output_tokens: data.usage?.completion_tokens || 0
      }
    };
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(anthropicShape));
  } catch (e) {
    jsonErr(res, 502, e.message);
  }
}

// ── API: OpenAI proxy ──
async function handleOpenAI(req, res) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return jsonErr(res, 500, 'OPENAI_API_KEY not set in .env.local');

  const body = await readBody(req);
  const payload = JSON.parse(body);

  try {
    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: payload.model || 'gpt-4o-mini',
        messages: payload.messages || [],
        max_tokens: payload.max_tokens || 1024,
      }),
    });
    if (!upstream.ok) {
      const detail = await upstream.text();
      return jsonErr(res, upstream.status, detail);
    }
    const data = await upstream.json();
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(data));
  } catch (e) {
    jsonErr(res, 502, e.message);
  }
}

// (HeyGen proxy removed — video-free build)

// ── Helpers ──
function readBody(req) {
  return new Promise((resolve, reject) => {
    let d = '';
    req.on('data', c => d += c);
    req.on('end', () => resolve(d));
    req.on('error', reject);
  });
}
function jsonErr(res, code, msg) {
  res.writeHead(code, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ error: msg }));
}

// ── Static file server ──
async function serveStatic(req, res) {
  let url = req.url.split('?')[0];
  if (url.endsWith('/')) url += 'index.html';

  const filePath = join(PUBLIC, url);

  if (!existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const stat = statSync(filePath);
  if (stat.isDirectory()) {
    res.writeHead(302, { Location: url + '/' });
    res.end();
    return;
  }

  const ext = extname(filePath).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';

  // Stream video files with range support
  if (ext === '.mp4') {
    const range = req.headers.range;
    if (range) {
      const { createReadStream } = await import('node:fs');
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunk = end - start + 1;
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunk,
        'Content-Type': 'video/mp4',
      });
      createReadStream(filePath, { start, end }).pipe(res);
      return;
    }
  }

  const content = readFileSync(filePath);
  res.writeHead(200, { 'content-type': mime, 'content-length': content.length, 'cache-control': 'no-store' });
  res.end(content);
}

// ── Router ──
const server = createServer(async (req, res) => {
  // CORS for local
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  try {
    // Log all API calls
    if (req.url.startsWith('/api/')) {
      console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    }
    if (req.url === '/api/elevenlabs' && req.method === 'POST') return handleElevenLabs(req, res);
    if (req.url === '/api/anthropic' && req.method === 'POST') return handleAnthropic(req, res);
    if (req.url === '/api/openai' && req.method === 'POST') return handleOpenAI(req, res);
    // (HeyGen route removed — video-free build)
    if (req.url === '/api/health' || req.url.startsWith('/api/health?')) {
      const health = {
        ok: true,
        timestamp: new Date().toISOString(),
        deployment: { vercelEnv: 'development', nodeVersion: process.version },
        keys: {
          anthropic: { configured: true, preview: 'routed→OpenAI' },
          openai:    { configured: !!process.env.OPENAI_API_KEY, preview: process.env.OPENAI_API_KEY ? 'set' : null },
          elevenlabs:{ configured: !!process.env.ELEVENLABS_API_KEY, preview: process.env.ELEVENLABS_API_KEY ? 'set' : null },
        }
      };
      res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
      res.end(JSON.stringify(health));
      return;
    }
    // Log 404s for API routes
    if (req.url.startsWith('/api/')) {
      console.log(`[404] No handler for ${req.method} ${req.url}`);
      return jsonErr(res, 404, 'Unknown API endpoint: ' + req.url);
    }
    serveStatic(req, res);
  } catch (e) {
    console.error(`[ERROR] ${req.method} ${req.url}:`, e.message || e);
    res.writeHead(500);
    res.end('Internal error: ' + (e.message || ''));
  }
});

server.listen(PORT, () => {
  console.log(`\n  ✅ Local server running!\n`);
  console.log(`  👉 Open: http://localhost:${PORT}/app/\n`);
  console.log(`  API keys loaded:`);
  console.log(`    ElevenLabs: ${process.env.ELEVENLABS_API_KEY ? '✅' : '❌ missing'}`);
  console.log(`    Anthropic:  ${process.env.ANTHROPIC_API_KEY ? '✅' : '❌ missing'}`);
  console.log(`    OpenAI:     ${process.env.OPENAI_API_KEY ? '✅' : '❌ missing'}`);
  console.log(`\n  Press Ctrl+C to stop.\n`);
});
