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
      const result = await router.routeOpenAI(req.body);

      if (req.body.stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        result.data.pipe(res);
      } else {
        return res.json(result);
      }
    } catch (error: any) {
      console.error('OpenAI endpoint error:', error.message);
      if (error.response?.data && !req.body.stream) {
         return res.status(error.response.status).json(error.response.data);
      }
      return res.status(error.response?.status || 500).json({
        error: {
          message: error.message,
          type: 'internal_server_error',
        },
      });
    }
  } else if (path === '/v1/messages' && req.method === 'POST') {
    try {
      const result = await router.routeAnthropic(req.body);

      if (req.body.stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        result.data.pipe(res);
      } else {
        return res.json(result);
      }
    } catch (error: any) {
      console.error('Anthropic endpoint error:', error.message);
      if (error.response?.data && !req.body.stream) {
         return res.status(error.response.status).json(error.response.data);
      }
      return res.status(error.response?.status || 500).json({
        error: {
          message: error.message,
          type: 'internal_server_error',
        },
      });
    }
  } else {
    return res.status(404).json({ error: { message: 'Not found', type: 'not_found' } });
  }
};

app.all('*', handleRoute);

const PORT = process.env.PORT || 3000;

if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Universal proxy server running on port ${PORT}`);
  });
}

export default app;
