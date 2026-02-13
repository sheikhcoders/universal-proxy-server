import { z } from 'zod';

export const MessageRole = z.enum(['system', 'user', 'assistant', 'tool', 'function']);
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
  z.object({
    type: z.literal('thinking'),
    thinking: z.string(),
    signature: z.string(),
  }),
  z.object({
    type: z.literal('redacted_thinking'),
    data: z.string(),
  }),
  z.object({
    type: z.literal('tool_use'),
    id: z.string(),
    name: z.string(),
    input: z.any(),
  }),
  z.object({
    type: z.literal('tool_result'),
    tool_use_id: z.string(),
    content: z.union([z.string(), z.array(z.any())]).optional(),
    is_error: z.boolean().optional(),
  }),
]);
export type ContentBlock = z.infer<typeof ContentBlock>;

export const AnthropicMessage = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.union([z.string(), z.array(ContentBlock)]),
});
export type AnthropicMessage = z.infer<typeof AnthropicMessage>;

export const AnthropicTool = z.object({
  name: z.string(),
  description: z.string().optional(),
  input_schema: z.any(),
});

export const AnthropicRequest = z.object({
  model: z.string(),
  messages: z.array(AnthropicMessage),
  system: z.union([z.string(), z.array(z.any())]).optional(),
  max_tokens: z.number().optional(),
  temperature: z.number().optional(),
  top_p: z.number().optional(),
  top_k: z.number().optional(),
  stream: z.boolean().optional(),
  stop_sequences: z.array(z.string()).optional(),
  tools: z.array(AnthropicTool).optional(),
  tool_choice: z.any().optional(),
  thinking: z.object({
    type: z.literal('enabled'),
    budget_tokens: z.number(),
  }).optional(),
});
export type AnthropicRequest = z.infer<typeof AnthropicRequest>;

export const OpenAIMessage = z.object({
  role: MessageRole,
  content: z.string().nullable().optional(),
  name: z.string().optional(),
  function_call: z.object({
    name: z.string(),
    arguments: z.string(),
  }).optional(),
  tool_calls: z.array(z.object({
    id: z.string(),
    type: z.literal('function'),
    function: z.object({
      name: z.string(),
      arguments: z.string(),
    }),
  })).optional(),
  tool_call_id: z.string().optional(),
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
  stop: z.union([z.string(), z.array(z.string())]).optional(),
  tools: z.array(z.any()).optional(),
  thinking: z.any().optional(),
  tool_choice: z.any().optional(),
});
export type OpenAIRequest = z.infer<typeof OpenAIRequest>;

export const AnthropicResponse = z.object({
  id: z.string(),
  type: z.literal('message'),
  role: z.literal('assistant'),
  content: z.array(ContentBlock),
  model: z.string(),
  stop_reason: z.string().optional().nullable(),
  stop_sequence: z.string().optional().nullable(),
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
