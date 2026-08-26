'use strict';

// Optional lightweight Render-side helper for V-TRADE FREE Vision.
// It does NOT bundle a model and does NOT call OpenAI.
// Point OLLAMA_BASE_URL to a self-hosted Ollama endpoint.
const http = require('http');
const PORT = Number(process.env.PORT || 10000);
const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.url === '/health') {
    res.end(JSON.stringify({ success: true, service: 'vtrade-free-vision-gateway', openai: false, provider: 'ollama-local' }));
    return;
  }
  res.statusCode = 404;
  res.end(JSON.stringify({ success: false, error: 'Not found' }));
});
server.listen(PORT, () => console.log(`[V-TRADE FREE VISION GATEWAY] listening on ${PORT} | OpenAI=OFF`));
