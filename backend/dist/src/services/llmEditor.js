"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.editItineraryWithLLM = editItineraryWithLLM;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const client = new sdk_1.default({ apiKey: process.env.ANTHROPIC_API_KEY });
const SYSTEM_PROMPT = `You are a travel itinerary editor.
You receive a JSON itinerary and a user edit instruction.
Return ONLY the modified itinerary as strict JSON. No explanation, no markdown, no extra text.`;
async function editItineraryWithLLM(itinerary, instruction) {
    const userPrompt = `Itinerary:\n${JSON.stringify(itinerary, null, 2)}\n\nEdit instruction: ${instruction}`;
    const message = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
    });
    const raw = message.content[0].type === 'text' ? message.content[0].text : '';
    const clean = raw.trim().replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start < 0 || end < 0)
        throw new Error('LLM did not return valid JSON');
    return JSON.parse(clean.slice(start, end + 1));
}
