import express, { Request, Response, NextFunction } from 'express';
import { createRouter } from './router';

const app = express();
app.use(express.json());

const router = createRouter();

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({
    error: {
      message: err.message,
      type: 'internal_server_error',
    },
  });
});

const handleRoute = async (req: Request, res: Response) => {
  const path = req.path || req.url;
  console.log('Received request:', req.method, path);

  if (path === '/health' && req.method === 'GET') {
    return res.json({ status: 'ok' });
  }

  if (path === '/v1/chat/completions' && req.method === 'POST') {
    try {
      const response = await router.routeOpenAI(req.body);
      return res.json(response);
    } catch (error: any) {
      console.error('OpenAI endpoint error:', error.message);
      return res.status(error.response?.status || 500).json({
        error: {
          message: error.message,
          type: 'internal_server_error',
        },
      });
    }
  }

  if (path === '/v1/messages' && req.method === 'POST') {
    try {
      const response = await router.routeAnthropic(req.body);
      return res.json(response);
    } catch (error: any) {
      console.error('Anthropic endpoint error:', error.message);
      return res.status(error.response?.status || 500).json({
        error: {
          message: error.message,
          type: 'internal_server_error',
        },
      });
    }
  }

  return res.status(404).json({ error: { message: 'Not found', type: 'not_found' } });
};

app.all('*', handleRoute);

const PORT = process.env.PORT || 3000;

if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Universal proxy server running on port ${PORT}`);
  });
}

export default app;
