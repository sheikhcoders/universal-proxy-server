import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  BackendType,
  ModelRoute,
  RouterConfig,
  BackendConfig,
  OpenAIRequest,
  AnthropicRequest,
} from './types';
import { OpenAITranslator } from './translators/openai';
import { AnthropicTranslator } from './translators/anthropic';

export class Router {
  private config: RouterConfig;
  private backendConfigs: Record<BackendType, BackendConfig>;
  private clients: Map<BackendType, AxiosInstance>;

  constructor(config: RouterConfig, backendConfigs: Record<BackendType, BackendConfig>) {
    this.config = config;
    this.backendConfigs = backendConfigs;
    this.clients = new Map();
    
    for (const [type, cfg] of Object.entries(backendConfigs)) {
      this.clients.set(type as BackendType, axios.create({
        baseURL: cfg.baseUrl,
        headers: {
          'Content-Type': 'application/json',
        },
      }));
    }
  }

  route(modelName: string): ModelRoute {
    const route = this.config[modelName];
    if (route) {
      return route;
    }
    
    for (const pattern of Object.keys(this.config)) {
      if (modelName.includes(pattern)) {
        return this.config[pattern];
      }
    }
    
    return {
      backend: 'custom',
      modelId: modelName,
    };
  }

  private getHeaders(backendType: BackendType) {
    const cfg = this.backendConfigs[backendType];
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${cfg.apiKey}`,
    };

    if (backendType === 'anthropic') {
      headers['x-api-key'] = cfg.apiKey;
      headers['anthropic-version'] = '2023-06-01';
    }

    return headers;
  }

  async routeOpenAI(request: OpenAIRequest): Promise<any> {
    const route = this.route(request.model);
    const client = this.clients.get(route.backend);
    
    if (!client) {
      throw new Error(`Unknown backend: ${route.backend}`);
    }

    const headers = this.getHeaders(route.backend);

    if (route.backend === 'anthropic') {
      const anthropicRequest = OpenAITranslator.toAnthropic(request);
      anthropicRequest.model = route.modelId;

      const response = await client.post('/v1/messages', anthropicRequest, {
        headers,
        responseType: request.stream ? 'stream' : 'json',
      });

      if (request.stream) {
        return response;
      }

      return OpenAITranslator.fromAnthropic(response.data, request.model);
    } else {
      const openAIRequest = { ...request, model: route.modelId };
      let endpoint = '/chat/completions';
      if (route.backend === 'custom' && !this.backendConfigs.custom.baseUrl.includes('/v1')) {
        endpoint = '/v1/chat/completions';
      }

      const response = await client.post(endpoint, openAIRequest, {
        headers,
        responseType: request.stream ? 'stream' : 'json',
      });

      return request.stream ? response : response.data;
    }
  }

  async routeAnthropic(request: AnthropicRequest): Promise<any> {
    const route = this.route(request.model);
    const client = this.clients.get(route.backend);
    
    if (!client) {
      throw new Error(`Unknown backend: ${route.backend}`);
    }

    const headers = this.getHeaders(route.backend);

    if (route.backend === 'openai' || route.backend === 'custom') {
      const openAIRequest = AnthropicTranslator.toOpenAI(request);
      openAIRequest.model = route.modelId;

      let endpoint = '/chat/completions';
      if (route.backend === 'custom' && !this.backendConfigs.custom.baseUrl.includes('/v1')) {
        endpoint = '/v1/chat/completions';
      }

      const response = await client.post(endpoint, openAIRequest, {
        headers,
        responseType: request.stream ? 'stream' : 'json',
      });

      if (request.stream) {
        return response;
      }

      return AnthropicTranslator.fromOpenAI(response.data);
    } else {
      const anthropicRequest = { ...request, model: route.modelId };
      const response = await client.post('/v1/messages', anthropicRequest, {
        headers,
        responseType: request.stream ? 'stream' : 'json',
      });

      return request.stream ? response : response.data;
    }
  }
}

export function createRouter(): Router {
  const config: RouterConfig = {
    'claude': { backend: 'anthropic', modelId: 'claude-sonnet-4-20250514' },
    'gpt-4': { backend: 'openai', modelId: 'gpt-4' },
    'gpt-3.5-turbo': { backend: 'openai', modelId: 'gpt-3.5-turbo' },
    'big-pickle': { backend: 'custom', modelId: 'big-pickle' },
    'minimax': { backend: 'custom', modelId: 'minimax-m2.5-free' },
  };

  const backends: Record<BackendType, BackendConfig> = {
    anthropic: {
      baseUrl: process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com',
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    },
    openai: {
      baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      apiKey: process.env.OPENAI_API_KEY || '',
    },
    custom: {
      baseUrl: process.env.CUSTOM_BASE_URL || 'http://localhost:8000',
      apiKey: process.env.CUSTOM_API_KEY || '',
    },
  };

  return new Router(config, backends);
}
