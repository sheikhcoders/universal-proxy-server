import axios, { AxiosInstance } from 'axios';
import { BackendType, ModelRoute, RouterConfig, BackendConfig } from './types';
import { OpenAITranslator } from './translators/openai';
import { AnthropicTranslator } from './translators/anthropic';

export class Router {
  private config: RouterConfig;
  private backends: Map<BackendType, AxiosInstance>;

  constructor(config: RouterConfig, backends: Record<BackendType, BackendConfig>) {
    this.config = config;
    this.backends = new Map();
    
    for (const [type, backendConfig] of Object.entries(backends)) {
      this.backends.set(type as BackendType, axios.create({
        baseURL: backendConfig.baseUrl,
        headers: {
          'Authorization': `Bearer ${backendConfig.apiKey}`,
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

  async routeOpenAI(request: any): Promise<any> {
    const route = this.route(request.model);
    const backend = this.backends.get(route.backend);
    
    if (!backend) {
      throw new Error(`Unknown backend: ${route.backend}`);
    }

    const anthropicRequest = OpenAITranslator.toAnthropic(request);
    anthropicRequest.model = route.modelId;

    const response = await backend.post('/messages', anthropicRequest);
    return OpenAITranslator.fromAnthropic(response.data, request.model);
  }

  async routeAnthropic(request: any): Promise<any> {
    const route = this.route(request.model);
    const backend = this.backends.get(route.backend);
    
    if (!backend) {
      throw new Error(`Unknown backend: ${route.backend}`);
    }

    const openAIRequest = AnthropicTranslator.toOpenAI(request);
    openAIRequest.model = route.modelId;

    const response = await backend.post('/chat/completions', openAIRequest);
    return AnthropicTranslator.fromOpenAI(response.data);
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
