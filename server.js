const http = require('http');
const { analyzeChatWithQwen as analyzeChatWithOpenAI, handleChatRequest, applyPlanUpdate } = require('./index');

const PREFERRED_PORT = process.env.PORT ? Number(process.env.PORT) : 3002;
const PORT_RANGE = PREFERRED_PORT === 0 ? [0] : [PREFERRED_PORT, 0];

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(payload, null, 2));
}

async function readRequestBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const rawBody = Buffer.concat(chunks).toString('utf8');

  if (!rawBody.trim()) {
    return null;
  }

  return JSON.parse(rawBody);
}

async function handleChatbotRequest(req, res) {
  try {
    const body = await readRequestBody(req);
    const message = typeof body?.message === 'string' ? body.message : '';

    if (!message.trim()) {
      return sendJson(res, 400, {
        error: 'Invalid request',
        message: 'The message field is required.'
      });
    }

    const currentItinerary = typeof body?.currentItinerary === 'object' ? body.currentItinerary : null;

    // Use OpenAI-backed RAG analysis when API key is provided, otherwise local analysis
    let analysis;
    if (process.env.OPENAI_API_KEY) {
      analysis = await analyzeChatWithOpenAI(message, currentItinerary);
    } else {
      const result = handleChatRequest({ message, currentItinerary });
      analysis = result.analysis;
    }

    // Determine updated itinerary from analysis and explicit apply flag
    let updatedItinerary = null;
    if (body && body.apply === true && analysis && analysis.suggestedReplacement) {
      updatedItinerary = applyPlanUpdate(currentItinerary, analysis, analysis.suggestedReplacement);
    }

    return sendJson(res, 200, {
      source: process.env.OPENAI_API_KEY ? 'openai-rag' : 'local-fallback',
      analysis,
      updatedItinerary
    });
  } catch (error) {
    return sendJson(res, 500, {
      error: 'Unable to process chatbot request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    return sendJson(res, 204, {});
  }

  if (req.method === 'GET' && req.url === '/health') {
    return sendJson(res, 200, { ok: true, service: 'chatbot' });
  }

  if (req.method === 'POST' && req.url === '/api/chatbot') {
    return void handleChatbotRequest(req, res);
  }

  return sendJson(res, 404, {
    error: 'Not found',
    routes: ['GET /health', 'POST /api/chatbot']
  });
});

function startServer(portIndex = 0) {
  const port = PORT_RANGE[portIndex];

  if (typeof port !== 'number') {
    console.error('No free port available in the chatbot server range.');
    process.exit(1);
  }

  server.once('error', (error) => {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'EADDRINUSE') {
      startServer(portIndex + 1);
      return;
    }

    console.error(error);
    process.exit(1);
  });

  server.listen(port, () => {
    const address = server.address();
    const actualPort = typeof address === 'object' && address ? address.port : port;
    console.log(`Chatbot API listening on http://localhost:${actualPort}`);
  });
}

startServer();
