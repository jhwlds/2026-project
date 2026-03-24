export function maskSensitiveTokens(text: string): string {
  return text
    .replace(/\b\d{12,19}\b/g, "[MASKED_CARD_OR_ACCOUNT]")
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[MASKED_ID]")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[MASKED_EMAIL]");
}
