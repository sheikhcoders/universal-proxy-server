import { AnthropicRequest, AnthropicResponse, OpenAIRequest, OpenAIResponse, OpenAIMessage } from '../types';

export class AnthropicTranslator {
  static toOpenAI(request: AnthropicRequest): OpenAIRequest {
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

  private static translateMessages(messages: any[]): OpenAIMessage[] {
    return messages.map(msg => {
      const content = msg.content;
      
      if (typeof content === 'string') {
        return {
          role: msg.role,
          content: content,
        };
      }
      
      if (Array.isArray(content)) {
        const textContent = content
          .filter((block: any) => block.type === 'text')
          .map((block: any) => block.text)
          .join('\n');
        
        return {
          role: msg.role,
          content: textContent,
        };
      }
      
      return {
        role: msg.role,
        content: String(content),
      };
    });
  }

  static fromOpenAI(response: OpenAIResponse): AnthropicResponse {
    const choice = response.choices[0];
    const contentText = choice.message.content || '';
    
    const contentBlock = [
      {
        type: 'text' as const,
        text: contentText,
      },
    ];

    return {
      id: response.id,
      type: 'message',
      role: 'assistant',
      content: contentBlock,
      model: response.model,
      stop_reason: choice.finish_reason || 'stop',
      usage: {
        input_tokens: response.usage.prompt_tokens,
        output_tokens: response.usage.completion_tokens,
      },
    };
  }
}
