import type { CategorizedTransaction, NormalizedTransaction } from "@/types/domain";

type Rule = {
  pattern: RegExp;
  category: string;
  subcategory: string | null;
};

const RULES: Rule[] = [
  { pattern: /\bCOSTCO GAS\b/i, category: "Transportation", subcategory: "Gas" },
  { pattern: /\bCOSTCO\b/i, category: "Groceries", subcategory: "Warehouse Club" },
  { pattern: /\bMCDONALD\b/i, category: "Dining", subcategory: "Fast Food" },
  { pattern: /\bAMAZON\b/i, category: "Shopping", subcategory: "Online Retail" },
  { pattern: /\bNETFLIX\b/i, category: "Subscriptions", subcategory: "Streaming" },
  { pattern: /\bUBER\b|\bLYFT\b/i, category: "Transportation", subcategory: "Ride Share" },
];

export function applyRuleBasedCategorization(
  transactions: NormalizedTransaction[],
): CategorizedTransaction[] {
  return transactions.map((tx) => {
    const matchedRule = RULES.find((rule) => rule.pattern.test(tx.merchant_normalized));
    if (!matchedRule) {
      return {
        ...tx,
        category: "Uncategorized",
        subcategory: null,
        confidence_score: 0.25,
        categorization_source: "rule",
      };
    }

    return {
      ...tx,
      category: matchedRule.category,
      subcategory: matchedRule.subcategory,
      confidence_score: 0.92,
      categorization_source: "rule",
    };
  });
}
