import OpenAI from 'openai';
import { config } from '../config.js';
import { log } from '../utils/logger.js';

const client = new OpenAI({ apiKey: config.openaiApiKey });

export interface GPTResponse {
  content: string;
  totalTokens: number;
  model: string;
}

export async function callGPT(
  system: string,
  user: string,
  opts?: { jsonMode?: boolean; maxTokens?: number },
): Promise<GPTResponse> {
  const model = config.openaiModel;
  log.debug(`Calling GPT (${model})`, { systemLen: system.length, userLen: user.length });

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    max_completion_tokens: opts?.maxTokens ?? 2000,
    temperature: 0.3,
    ...(opts?.jsonMode ? { response_format: { type: 'json_object' } } : {}),
  });

  const content = response.choices[0]?.message?.content ?? '';
  const totalTokens = response.usage?.total_tokens ?? 0;

  log.debug('GPT response', { tokens: totalTokens, contentLen: content.length });

  return { content, totalTokens, model };
}
