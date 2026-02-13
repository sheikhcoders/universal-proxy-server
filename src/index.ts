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

app.post('/v1/chat/completions', async (req: Request, res: Response) => {
  try {
    const response = await router.routeOpenAI(req.body);
    res.json(response);
  } catch (error: any) {
    console.error('OpenAI endpoint error:', error.message);
    res.status(error.response?.status || 500).json({
      error: {
        message: error.message,
        type: 'internal_server_error',
      },
    });
  }
});

app.post('/v1/messages', async (req: Request, res: Response) => {
  try {
    const response = await router.routeAnthropic(req.body);
    res.json(response);
  } catch (error: any) {
    console.error('Anthropic endpoint error:', error.message);
    res.status(error.response?.status || 500).json({
      error: {
        message: error.message,
        type: 'internal_server_error',
      },
    });
  }
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;

if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Universal proxy server running on port ${PORT}`);
  });
}

export default app;
