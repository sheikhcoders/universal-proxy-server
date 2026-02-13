import {
  AnthropicRequest,
  AnthropicResponse,
  OpenAIRequest,
  OpenAIResponse,
  OpenAIMessage
} from '../types';

export class AnthropicTranslator {
  static toOpenAI(request: AnthropicRequest): OpenAIRequest {
    const messages: OpenAIMessage[] = [];

    if (request.system) {
      if (typeof request.system === 'string') {
        messages.push({
          role: 'system',
          content: request.system,
        });
      } else if (Array.isArray(request.system)) {
        const systemText = request.system
          .map(block => (typeof block === 'string' ? block : block.text))
          .join('\n');
        messages.push({
          role: 'system',
          content: systemText,
        });
      }
    }

    for (const msg of request.messages) {
      const content = msg.content;
      
      if (typeof content === 'string') {
        messages.push({
          role: msg.role,
          content: content,
        });
      } else if (Array.isArray(content)) {
        let textContent = '';
        const toolCalls: any[] = [];
        
        for (const block of content) {
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
          } else if (block.type === 'tool_result') {
            messages.push({
              role: 'tool',
              tool_call_id: block.tool_use_id,
              content: typeof block.content === 'string' ? block.content : JSON.stringify(block.content),
            });
          }
        }

        if (textContent || toolCalls.length > 0) {
          messages.push({
            role: msg.role,
            content: textContent || null,
            tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
          });
        }
      }
    }

    const openAITools = request.tools?.map((t: any) => ({
      type: 'function',
      function: {
        name: t.name,
        description: t.description,
        parameters: t.input_schema,
      },
    }));

    let openAIToolChoice: any = undefined;
    if (request.tool_choice) {
      if (request.tool_choice.type === 'auto') openAIToolChoice = 'auto';
      else if (request.tool_choice.type === 'none') openAIToolChoice = 'none';
      else if (request.tool_choice.type === 'any') openAIToolChoice = 'required';
      else if (request.tool_choice.type === 'tool') {
        openAIToolChoice = {
          type: 'function',
          function: { name: request.tool_choice.name },
        };
      }
    }

    return {
      model: request.model,
      messages: messages,
      max_tokens: request.max_tokens,
      temperature: request.temperature,
      top_p: request.top_p,
      stream: request.stream,
      stop: request.stop_sequences,
      tools: openAITools,
      tool_choice: openAIToolChoice,
      thinking: request.thinking,
    };
  }

  static fromOpenAI(response: OpenAIResponse): AnthropicResponse {
    const choice = response.choices[0];
    const contentBlocks: any[] = [];
    
    if (choice.message.content) {
      contentBlocks.push({
        type: 'text',
        text: choice.message.content,
      });
    }

    if (choice.message.tool_calls) {
      for (const tc of choice.message.tool_calls) {
        contentBlocks.push({
          type: 'tool_use',
          id: tc.id,
          name: tc.function.name,
          input: JSON.parse(tc.function.arguments),
        });
      }
    }

    return {
      id: response.id,
      type: 'message',
      role: 'assistant',
      content: contentBlocks,
      model: response.model,
      stop_reason: choice.finish_reason === 'tool_calls' ? 'tool_use' : (choice.finish_reason || 'stop'),
      usage: {
        input_tokens: response.usage.prompt_tokens,
        output_tokens: response.usage.completion_tokens,
      },
    };
  }
}
