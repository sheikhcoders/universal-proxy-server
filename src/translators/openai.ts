import { OpenAIMessage, OpenAIRequest, OpenAIResponse, AnthropicRequest, AnthropicResponse, AnthropicMessage, ContentBlock } from '../types';

export class OpenAITranslator {
  static toAnthropic(request: OpenAIRequest): AnthropicRequest {
    const messages = this.translateMessages(request.messages);
    
    return {
      model: request.model,
      messages: messages,
      max_tokens: request.max_tokens,
      temperature: request.temperature,
      top_p: request.top_p,
      stream: request.stream,
    };
  }

  private static translateMessages(messages: OpenAIMessage[]): AnthropicMessage[] {
    return messages.map(msg => {
      const content = msg.content;
      
      if (content === null) {
        return {
          role: msg.role as 'system' | 'user' | 'assistant',
          content: '',
        };
      }
      
      if (typeof content === 'string') {
        return {
          role: msg.role as 'system' | 'user' | 'assistant',
          content: content,
        };
      }
      
      return {
        role: msg.role as 'system' | 'user' | 'assistant',
        content: content,
      };
    });
  }

  static fromAnthropic(response: AnthropicResponse, model: string): OpenAIResponse {
    const contentBlock = response.content[0];
    const textContent = contentBlock?.type === 'text' ? contentBlock.text : '';
    
    const message: OpenAIMessage = {
      role: 'assistant',
      content: textContent,
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
          finish_reason: response.stop_reason || 'stop',
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
