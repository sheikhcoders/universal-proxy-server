import { OpenAITranslator } from '../translators/openai';
import { AnthropicTranslator } from '../translators/anthropic';
import { OpenAIRequest, AnthropicRequest } from '../types';

describe('OpenAITranslator', () => {
  test('toAnthropic should translate system message correctly', () => {
    const request: OpenAIRequest = {
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello!' }
      ]
    };
    const translated = OpenAITranslator.toAnthropic(request);
    expect(translated.system).toBe('You are a helpful assistant.');
    expect(translated.messages).toHaveLength(1);
    expect(translated.messages[0].role).toBe('user');
  });

  test('toAnthropic should translate tools correctly', () => {
    const request: OpenAIRequest = {
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'What is the weather?' }],
      tools: [
        {
          type: 'function',
          function: {
            name: 'get_weather',
            description: 'Get weather',
            parameters: { type: 'object', properties: { location: { type: 'string' } } }
          }
        }
      ]
    };
    const translated = OpenAITranslator.toAnthropic(request);
    expect(translated.tools).toHaveLength(1);
    expect(translated.tools![0].name).toBe('get_weather');
  });
});

describe('AnthropicTranslator', () => {
  test('toOpenAI should translate system field correctly', () => {
    const request: AnthropicRequest = {
      model: 'claude-3-5-sonnet-20240620',
      messages: [{ role: 'user', content: 'Hello!' }],
      system: 'You are Claude.'
    };
    const translated = AnthropicTranslator.toOpenAI(request);
    expect(translated.messages[0].role).toBe('system');
    expect(translated.messages[0].content).toBe('You are Claude.');
    expect(translated.messages[1].role).toBe('user');
  });
});
