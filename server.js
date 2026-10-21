// Standalone production Node server for HealthSense AI
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleChatRequest, handleAnalyzeRequest } from './server/geminiService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env if not loaded
if (!process.env.GEMINI_API_KEY) {
  try {
    const envPath = path.resolve(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [k, ...rest] = trimmed.split('=');
          const v = rest.join('=').trim().replace(/^["']|["']$/g, '');
          process.env[k.trim()] = v;
        }
      }
    }
  } catch (err) {
    console.warn('Could not read .env file:', err);
  }
}

const PORT = process.env.PORT || 5173;
const DIST_DIR = path.resolve(__dirname, 'dist');

function parseJsonBody(req, limitBytes = 25 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > limitBytes) {
        reject(new Error('Payload too large'));
        return;
      }
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.end(JSON.stringify(data));
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

const server = http.createServer(async (req, res) => {
  const url = req.url.split('?')[0];

  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.end();
    return;
  }

  // Health check
  if (url === '/api/health' && req.method === 'GET') {
    sendJson(res, 200, {
      status: 'ok',
      geminiConfigured: !!(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY),
      supportedModels: ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.8-flash']
    });
    return;
  }

  // Chat API
  if ((url === '/api/chat' || url === '/api/gemini/chat') && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const result = await handleChatRequest(body.messages, body.reportContext);
      sendJson(res, 200, result);
    } catch (err) {
      console.error('[API /api/chat error]:', err.message);
      sendJson(res, err.message?.includes('quota') ? 429 : 500, { error: err.message || 'Chat generation failed' });
    }
    return;
  }

  // Analyze API
  if ((url === '/api/analyze' || url === '/api/gemini/analyze') && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const result = await handleAnalyzeRequest(body);
      sendJson(res, 200, result);
    } catch (err) {
      console.error('[API /api/analyze error]:', err.message);
      sendJson(res, err.message?.includes('quota') ? 429 : 500, { error: err.message || 'Image analysis failed' });
    }
    return;
  }

  // Static files in production
  if (fs.existsSync(DIST_DIR)) {
    let filePath = path.join(DIST_DIR, url === '/' ? 'index.html' : url);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(DIST_DIR, 'index.html');
    }
    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath);
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
      return;
    }
  }

  res.statusCode = 404;
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`HealthSense AI server listening on http://localhost:${PORT}`);
});
