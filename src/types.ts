import { z } from 'zod';

export const MessageRole = z.enum(['system', 'user', 'assistant', 'tool']);
export type MessageRole = z.infer<typeof MessageRole>;

export const ContentBlock = z.union([
  z.object({
    type: z.literal('text'),
    text: z.string(),
  }),
  z.object({
    type: z.literal('image'),
    source: z.object({
      type: z.literal('base64'),
      media_type: z.string(),
      data: z.string(),
    }),
  }),
]);
export type ContentBlock = z.infer<typeof ContentBlock>;

export const AnthropicMessage = z.object({
  role: MessageRole,
  content: z.union([z.string(), z.array(ContentBlock)]),
});
export type AnthropicMessage = z.infer<typeof AnthropicMessage>;

export const AnthropicRequest = z.object({
  model: z.string(),
  messages: z.array(AnthropicMessage),
  max_tokens: z.number().optional(),
  temperature: z.number().optional(),
  top_p: z.number().optional(),
  stream: z.boolean().optional(),
});
export type AnthropicRequest = z.infer<typeof AnthropicRequest>;

export const OpenAIMessage = z.object({
  role: z.enum(['system', 'user', 'assistant', 'function']),
  content: z.string().nullable(),
  name: z.string().optional(),
  function_call: z.object({
    name: z.string(),
    arguments: z.string(),
  }).optional(),
});
export type OpenAIMessage = z.infer<typeof OpenAIMessage>;

export const OpenAIRequest = z.object({
  model: z.string(),
  messages: z.array(OpenAIMessage),
  max_tokens: z.number().optional(),
  temperature: z.number().optional(),
  top_p: z.number().optional(),
  stream: z.boolean().optional(),
  n: z.number().optional(),
});
export type OpenAIRequest = z.infer<typeof OpenAIRequest>;

export const AnthropicResponse = z.object({
  id: z.string(),
  type: z.literal('message'),
  role: z.literal('assistant'),
  content: z.array(ContentBlock),
  model: z.string(),
  stop_reason: z.string().optional(),
  usage: z.object({
    input_tokens: z.number(),
    output_tokens: z.number(),
  }),
});
export type AnthropicResponse = z.infer<typeof AnthropicResponse>;

export const OpenAIResponse = z.object({
  id: z.string(),
  object: z.literal('chat.completion'),
  created: z.number(),
  model: z.string(),
  choices: z.array(z.object({
    index: z.number(),
    message: OpenAIMessage,
    finish_reason: z.string().nullable(),
  })),
  usage: z.object({
    prompt_tokens: z.number(),
    completion_tokens: z.number(),
    total_tokens: z.number(),
  }),
});
export type OpenAIResponse = z.infer<typeof OpenAIResponse>;

export type BackendType = 'anthropic' | 'openai' | 'custom';

export interface ModelRoute {
  backend: BackendType;
  modelId: string;
}

export interface RouterConfig {
  [modelName: string]: ModelRoute;
}

export interface BackendConfig {
  baseUrl: string;
  apiKey: string;
}
