export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const hasKey = !!(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY);
  const data = {
    status: 'ok',
    geminiConfigured: hasKey,
    supportedModels: ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.8-flash']
  };

  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(200).json(data);
  }
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}
