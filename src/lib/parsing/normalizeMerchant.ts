const COMMON_SUFFIXES = [
  "INC",
  "LLC",
  "CO",
  "CORP",
  "CORPORATION",
  "LTD",
  "STORE",
];

export function normalizeMerchantName(input: string): string {
  const upper = input.toUpperCase().trim();

  const cleaned = upper
    .replace(/\s{2,}/g, " ")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  const tokens = cleaned.split(" ").filter(Boolean);
  const filtered = tokens.filter((token) => !COMMON_SUFFIXES.includes(token));

  return filtered.join(" ").trim();
}
