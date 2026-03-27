import OpenAI from "openai";

import type { CategorizedTransaction, NormalizedTransaction } from "@/types/domain";

const DEFAULT_MODEL = "gpt-4.1-mini";

const CATEGORY_GUIDE = [
  "Groceries",
  "Dining",
  "Transportation",
  "Shopping",
  "Subscriptions",
  "Utilities",
  "Housing",
  "Health",
  "Travel",
  "Entertainment",
  "Education",
  "Insurance",
  "Taxes",
  "Income",
  "Fees",
  "Transfer",
  "Uncategorized",
];

type AiCategoryItem = {
  index: number;
  category: string;
  subcategory: string | null;
  confidence_score: number;
};

type AiCategoryResponse = {
  items: AiCategoryItem[];
};

export async function categorizeTransactionsWithAi(
  transactions: NormalizedTransaction[],
): Promise<CategorizedTransaction[]> {
  if (transactions.length === 0) return [];

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY for AI categorization.");
  }

  const client = new OpenAI({ apiKey });
  const inputRows = transactions.map((tx, index) => ({
    index,
    merchant_normalized: tx.merchant_normalized,
    merchant_raw: tx.merchant_raw,
    amount: tx.amount,
    date: tx.date,
  }));

  const completion = await client.chat.completions.create({
    model: DEFAULT_MODEL,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You categorize credit-card transactions. Output only JSON with exact schema {\"items\":[{\"index\":number,\"category\":string,\"subcategory\":string|null,\"confidence_score\":number}]}. " +
          "Use confidence_score in [0,1]. Keep item count equal to input count and preserve index values.",
      },
      {
        role: "user",
        content:
          "Allowed top-level categories (prefer one of these): " +
          `${CATEGORY_GUIDE.join(", ")}.\n` +
          "Classify these transactions:\n" +
          JSON.stringify(inputRows),
      },
    ],
  });

  const rawContent = completion.choices[0]?.message?.content ?? "";
  const parsed = safeParseAiResponse(rawContent);

  const byIndex = new Map<number, AiCategoryItem>();
  for (const item of parsed.items) {
    byIndex.set(item.index, item);
  }

  return transactions.map((tx, index) => {
    const ai = byIndex.get(index);
    if (!ai) {
      return {
        ...tx,
        category: "Uncategorized",
        subcategory: null,
        confidence_score: 0,
        categorization_source: "ai",
      };
    }

    return {
      ...tx,
      category: normalizeText(ai.category, "Uncategorized"),
      subcategory: normalizeNullableText(ai.subcategory),
      confidence_score: clamp01(ai.confidence_score),
      categorization_source: "ai",
    };
  });
}

function safeParseAiResponse(rawContent: string): AiCategoryResponse {
  try {
    const parsed = JSON.parse(rawContent) as Partial<AiCategoryResponse>;
    if (!parsed || !Array.isArray(parsed.items)) {
      return { items: [] };
    }

    const items = parsed.items
      .map((item) => {
        const row = item as Partial<AiCategoryItem>;
        if (typeof row.index !== "number" || !Number.isInteger(row.index) || row.index < 0) {
          return null;
        }
        return {
          index: row.index,
          category: normalizeText(row.category, "Uncategorized"),
          subcategory: normalizeNullableText(row.subcategory),
          confidence_score: clamp01(row.confidence_score),
        };
      })
      .filter((item): item is AiCategoryItem => item !== null);

    return { items };
  } catch {
    return { items: [] };
  }
}

function normalizeText(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : fallback;
}

function normalizeNullableText(value: unknown) {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : null;
}

function clamp01(value: unknown) {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return 0;
  if (num < 0) return 0;
  if (num > 1) return 1;
  return Math.round(num * 1000) / 1000;
}
