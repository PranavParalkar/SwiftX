import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY;
const anthropic = apiKey ? new Anthropic({ apiKey }) : null;

export const INSIGHT_MODEL = "claude-sonnet-4-6";

export type TxSummary = {
  date: string;
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  receivedAmount: number;
};

export type InsightInput = {
  userName: string;
  countryCode: string;
  language: "en" | "hi";
  recentTransactions: TxSummary[];
};

export async function generateInsight(input: InsightInput): Promise<string> {
  if (!anthropic) {
    return "AI insights unavailable — set ANTHROPIC_API_KEY in .env.local.";
  }

  const langName = input.language === "hi" ? "Hindi" : "English";
  const txJson = JSON.stringify(input.recentTransactions, null, 2);

  const msg = await anthropic.messages.create({
    model: INSIGHT_MODEL,
    max_tokens: 240,
    messages: [
      {
        role: "user",
        content: `You are a warm financial advisor speaking to a migrant worker.

User: ${input.userName}, sending remittances from ${input.countryCode} to family in India.
Recent transactions (most recent first):
${txJson}

Write ONE short personalized financial tip in ${langName}. Constraints:
- Max 50 words.
- Reference a concrete number from their pattern (total sent, average, frequency).
- Suggest one realistic micro-action (e.g. ₹100/week SIP, round-up jar).
- Warm, never patronizing. No emojis. No headings. No preamble.`,
      },
    ],
  });

  const block = msg.content[0];
  if (block.type === "text") return block.text.trim();
  return "";
}
