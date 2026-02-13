import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  const url = request.url || '';
  const path = url.split('?')[0];

  console.log('Request:', request.method, path);

  if (path === '/health' && request.method === 'GET') {
    return response.json({ status: 'ok' });
  }

  if (path === '/v1/chat/completions' && request.method === 'POST') {
    try {
      const { model, messages, max_tokens, temperature, top_p, stream } = request.body;
      const route = routeRequest(model);

      if (route.backend === 'anthropic') {
        const anthropicResponse = await axios.post(
          `${process.env.ANTHROPIC_BASE_URL}/v1/messages`,
          {
            model: route.modelId,
            messages: messages.map((m: any) => ({
              role: m.role,
              content: m.content,
            })),
            max_tokens,
            temperature,
            top_p,
            stream,
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.ANTHROPIC_API_KEY}`,
              'Content-Type': 'application/json',
              'x-api-key': process.env.ANTHROPIC_API_KEY,
            },
          }
        );

        const content = anthropicResponse.data.content?.[0]?.text || '';
        return response.json({
          id: anthropicResponse.data.id,
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model: model,
          choices: [{
            index: 0,
            message: {
              role: 'assistant',
              content: content,
            },
            finish_reason: anthropicResponse.data.stop_reason || 'stop',
          }],
          usage: {
            prompt_tokens: anthropicResponse.data.usage?.input_tokens || 0,
            completion_tokens: anthropicResponse.data.usage?.output_tokens || 0,
            total_tokens: (anthropicResponse.data.usage?.input_tokens || 0) + (anthropicResponse.data.usage?.output_tokens || 0),
          },
        });
      }

      if (route.backend === 'openai') {
        const openaiResponse = await axios.post(
          `${process.env.OPENAI_BASE_URL}/chat/completions`,
          {
            model: route.modelId,
            messages,
            max_tokens,
            temperature,
            top_p,
            stream,
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );

        return response.json(openaiResponse.data);
      }

      if (route.backend === 'custom') {
        const customResponse = await axios.post(
          `${process.env.CUSTOM_BASE_URL}/v1/chat/completions`,
          {
            model: route.modelId,
            messages,
            max_tokens,
            temperature,
            top_p,
            stream,
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.CUSTOM_API_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );

        return response.json(customResponse.data);
      }

      return response.status(500).json({ error: { message: 'Unknown backend', type: 'internal_error' } });
    } catch (error: any) {
      console.error('OpenAI endpoint error:', error.message);
      return response.status(error.response?.status || 500).json({
        error: {
          message: error.message,
          type: 'internal_server_error',
        },
      });
    }
  }

  if (path === '/v1/messages' && request.method === 'POST') {
    try {
      const { model, messages, max_tokens, temperature, top_p, stream } = request.body;
      const route = routeRequest(model);

      if (route.backend === 'openai') {
        const openaiResponse = await axios.post(
          `${process.env.OPENAI_BASE_URL}/chat/completions`,
          {
            model: route.modelId,
            messages: messages.map((m: any) => ({
              role: m.role,
              content: m.content,
            })),
            max_tokens,
            temperature,
            top_p,
            stream,
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const choice = openaiResponse.data.choices[0];
        return response.json({
          id: openaiResponse.data.id,
          type: 'message',
          role: 'assistant',
          content: [{
            type: 'text',
            text: choice.message.content || '',
          }],
          model: model,
          stop_reason: choice.finish_reason || 'stop',
          usage: {
            input_tokens: openaiResponse.data.usage?.prompt_tokens || 0,
            output_tokens: openaiResponse.data.usage?.completion_tokens || 0,
          },
        });
      }

      if (route.backend === 'anthropic') {
        const anthropicResponse = await axios.post(
          `${process.env.ANTHROPIC_BASE_URL}/v1/messages`,
          {
            model: route.modelId,
            messages,
            max_tokens,
            temperature,
            top_p,
            stream,
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.ANTHROPIC_API_KEY}`,
              'Content-Type': 'application/json',
              'x-api-key': process.env.ANTHROPIC_API_KEY,
            },
          }
        );

        return response.json(anthropicResponse.data);
      }

      if (route.backend === 'custom') {
        const customResponse = await axios.post(
          `${process.env.CUSTOM_BASE_URL}/v1/messages`,
          {
            model: route.modelId,
            messages,
            max_tokens,
            temperature,
            top_p,
            stream,
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.CUSTOM_API_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );

        return response.json(customResponse.data);
      }

      return response.status(500).json({ error: { message: 'Unknown backend', type: 'internal_error' } });
    } catch (error: any) {
      console.error('Anthropic endpoint error:', error.message);
      return response.status(error.response?.status || 500).json({
        error: {
          message: error.message,
          type: 'internal_server_error',
        },
      });
    }
  }

  return response.status(404).json({ error: { message: 'Not found', type: 'not_found' } });
}

function routeRequest(modelName: string): { backend: string; modelId: string } {
  const routes: Record<string, { backend: string; modelId: string }> = {
    'claude': { backend: 'anthropic', modelId: 'claude-sonnet-4-20250514' },
    'gpt-4': { backend: 'openai', modelId: 'gpt-4' },
    'gpt-3.5-turbo': { backend: 'openai', modelId: 'gpt-3.5-turbo' },
    'big-pickle': { backend: 'custom', modelId: 'big-pickle' },
    'minimax': { backend: 'custom', modelId: 'minimax-m2.5-free' },
  };

  for (const [pattern, route] of Object.entries(routes)) {
    if (modelName.includes(pattern)) {
      return route;
    }
  }

  return { backend: 'custom', modelId: modelName };
}
