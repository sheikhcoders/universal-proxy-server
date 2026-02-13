import { VercelRequest, VercelResponse } from '@vercel/node';
import { createRouter } from '../src/router';

const router = createRouter();

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  const url = request.url || '';
  const path = url.split('?')[0];

  console.log('Vercel Request:', request.method, path);

  if (path === '/health' && request.method === 'GET') {
    return response.json({ status: 'ok' });
  }

  try {
    if (path === '/v1/chat/completions' && request.method === 'POST') {
      const result = await router.routeOpenAI(request.body);
      if (request.body.stream) {
        // Vercel handles streaming differently in some environments,
        // but passing the stream response should work if result is a stream.
        response.setHeader('Content-Type', 'text/event-stream');
        response.setHeader('Cache-Control', 'no-cache');
        response.setHeader('Connection', 'keep-alive');
        result.data.pipe(response);
      } else {
        return response.json(result);
      }
    } else if (path === '/v1/messages' && request.method === 'POST') {
      const result = await router.routeAnthropic(request.body);
      if (request.body.stream) {
        response.setHeader('Content-Type', 'text/event-stream');
        response.setHeader('Cache-Control', 'no-cache');
        response.setHeader('Connection', 'keep-alive');
        result.data.pipe(response);
      } else {
        return response.json(result);
      }
    } else {
      return response.status(404).json({ error: { message: 'Not found', type: 'not_found' } });
    }
  } catch (error: any) {
    console.error('Vercel handler error:', error.message);
    const status = error.response?.status || 500;
    const data = error.response?.data;

    if (data && typeof data === 'object') {
      return response.status(status).json(data);
    }

    return response.status(status).json({
      error: {
        message: error.message,
        type: 'internal_server_error',
      },
    });
  }
}
