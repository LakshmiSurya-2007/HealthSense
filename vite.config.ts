import { defineConfig, loadEnv } from 'vite'
import type { Plugin, ViteDevServer, PreviewServer } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import type { IncomingMessage, ServerResponse } from 'http'
import { handleChatRequest, handleAnalyzeRequest } from './server/geminiService.js'

function parseJsonBody<T = any>(req: IncomingMessage, limitBytes = 25 * 1024 * 1024): Promise<T> {
  return new Promise((resolve, reject) => {
    let body = ''
    let size = 0
    req.on('data', chunk => {
      size += chunk.length
      if (size > limitBytes) {
        reject(new Error('Payload too large'))
        return
      }
      body += chunk
    })
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch (e) {
        reject(new Error('Invalid JSON payload'))
      }
    })
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, status: number, data: any) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  res.end(JSON.stringify(data))
}

function geminiApiPlugin(): Plugin {
  const handler = async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = req.url?.split('?')[0]

    // Handle CORS preflight
    if (req.method === 'OPTIONS' && (url?.startsWith('/api/chat') || url?.startsWith('/api/analyze') || url?.startsWith('/api/health'))) {
      res.statusCode = 204
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
      res.end()
      return
    }

    if (url === '/api/health' && req.method === 'GET') {
      const hasKey = !!(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY)
      sendJson(res, 200, {
        status: 'ok',
        geminiConfigured: hasKey,
        supportedModels: ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.8-flash']
      })
      return
    }

    if ((url === '/api/chat' || url === '/api/gemini/chat') && req.method === 'POST') {
      try {
        const body = await parseJsonBody<{ messages: Array<{ role: string; content: string }>; reportContext?: any }>(req)
        const result = await handleChatRequest(body.messages, body.reportContext)
        sendJson(res, 200, result)
      } catch (err: any) {
        console.error('[API /api/chat error]:', err.message)
        sendJson(res, err.message?.includes('quota') ? 429 : 500, {
          error: err.message || 'Chat generation failed'
        })
      }
      return
    }

    if ((url === '/api/analyze' || url === '/api/gemini/analyze') && req.method === 'POST') {
      try {
        const body = await parseJsonBody<{ base64Image: string; mimeType: string; context?: string }>(req)
        const result = await handleAnalyzeRequest(body)
        sendJson(res, 200, result)
      } catch (err: any) {
        console.error('[API /api/analyze error]:', err.message)
        sendJson(res, err.message?.includes('quota') ? 429 : 500, {
          error: err.message || 'Image analysis failed'
        })
      }
      return
    }

    next()
  }

  return {
    name: 'gemini-api-plugin',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(handler)
    },
    configurePreviewServer(server: PreviewServer) {
      server.middlewares.use(handler)
    }
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Ensure server-side GEMINI_API_KEY is available
  if (env.GEMINI_API_KEY) {
    process.env.GEMINI_API_KEY = env.GEMINI_API_KEY
  } else if (env.VITE_GEMINI_API_KEY) {
    process.env.GEMINI_API_KEY = env.VITE_GEMINI_API_KEY
  }

  return {
    plugins: [react(), geminiApiPlugin()],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
    server: { port: 5173 },
  }
})
