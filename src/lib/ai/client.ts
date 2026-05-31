import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

type GenerateTextParams = {
  systemPrompt: string;
  userPrompt: string;
};

function getProvider(): 'anthropic' | 'gemini' {
  const provider = (process.env.AI_PROVIDER || '').toLowerCase();

  if (provider === 'gemini') return 'gemini';
  if (provider === 'anthropic') return 'anthropic';

  return process.env.GEMINI_API_KEY ? 'gemini' : 'anthropic';
}

export async function generateAIText({ systemPrompt, userPrompt }: GenerateTextParams): Promise<string> {
  if (getProvider() === 'gemini') {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set');
    }

    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
      systemInstruction: systemPrompt,
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    return result.response.text();
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set');
  }

  const anthropic = new Anthropic({ apiKey });
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  return message.content[0].type === 'text' ? message.content[0].text : '';
}
