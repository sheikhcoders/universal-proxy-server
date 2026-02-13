import {
  OpenAIMessage,
  OpenAIRequest,
  OpenAIResponse,
  AnthropicRequest,
  AnthropicResponse,
  AnthropicMessage,
  ContentBlock
} from '../types';

export class OpenAITranslator {
  static toAnthropic(request: OpenAIRequest): AnthropicRequest {
    let system = '';
    const messages: AnthropicMessage[] = [];

    for (const msg of request.messages) {
      if (msg.role === 'system') {
        system += (system ? '\n' : '') + (msg.content || '');
      } else if (msg.role === 'user') {
        messages.push({
          role: 'user',
          content: msg.content || '',
        });
      } else if (msg.role === 'assistant') {
        const content: ContentBlock[] = [];
        if (msg.content) {
          content.push({ type: 'text', text: msg.content });
        }
        if (msg.tool_calls) {
          for (const tc of msg.tool_calls) {
            content.push({
              type: 'tool_use',
              id: tc.id,
              name: tc.function.name,
              input: JSON.parse(tc.function.arguments),
            });
          }
        }
        messages.push({
          role: 'assistant',
          content: content.length > 0 ? content : '',
        });
      } else if (msg.role === 'tool') {
        messages.push({
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: msg.tool_call_id || '',
              content: msg.content || '',
            },
          ],
        });
      }
    }
    
    let stop_sequences: string[] | undefined = undefined;
    if (typeof request.stop === 'string') {
      stop_sequences = [request.stop];
    } else if (Array.isArray(request.stop)) {
      stop_sequences = request.stop;
    }

    const anthropicTools = request.tools?.map((t: { function: { name: string; description?: string; parameters: unknown } }) => ({
      name: t.function.name,
      description: t.function.description,
      input_schema: t.function.parameters,
    }));

    let anthropicToolChoice: AnthropicRequest['tool_choice'] = undefined;
    if (request.tool_choice) {
      if (typeof request.tool_choice === 'string') {
        if (request.tool_choice === 'auto') anthropicToolChoice = { type: 'auto' };
        else if (request.tool_choice === 'none') anthropicToolChoice = { type: 'none' };
        else if (request.tool_choice === 'required') anthropicToolChoice = { type: 'any' };
      } else if (typeof request.tool_choice === 'object') {
        const tc = request.tool_choice as { function: { name: string } };
        anthropicToolChoice = {
          type: 'tool',
          name: tc.function.name,
        };
      }
    }

    return {
      model: request.model,
      messages: messages,
      system: system || undefined,
      max_tokens: request.max_tokens || 4096,
      temperature: request.temperature,
      top_p: request.top_p,
      stream: request.stream,
      stop_sequences: stop_sequences,
      tools: anthropicTools,
      tool_choice: anthropicToolChoice,
      thinking: request.thinking,
    };
  }

  static fromAnthropic(response: AnthropicResponse, model: string): OpenAIResponse {
    let textContent = '';
    const toolCalls: Array<{
      id: string;
      type: 'function';
      function: { name: string; arguments: string };
    }> = [];

    for (const block of response.content) {
      if (block.type === 'text') {
        textContent += block.text;
      } else if (block.type === 'tool_use') {
        toolCalls.push({
          id: block.id,
          type: 'function',
          function: {
            name: block.name,
            arguments: JSON.stringify(block.input),
          },
        });
      }
    }
    
    const message: OpenAIMessage = {
      role: 'assistant',
      content: textContent || null,
      tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
    };

    return {
      id: response.id,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: model,
      choices: [
        {
          index: 0,
          message: message,
          finish_reason: response.stop_reason === 'tool_use' ? 'tool_calls' : (response.stop_reason || 'stop'),
        },
      ],
      usage: {
        prompt_tokens: response.usage.input_tokens,
        completion_tokens: response.usage.output_tokens,
        total_tokens: response.usage.input_tokens + response.usage.output_tokens,
      },
    };
  }
}
