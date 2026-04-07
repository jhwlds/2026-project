export type ProcessingStatus =
  | "uploaded"
  | "parsing"
  | "categorized"
  | "completed"
  | "failed";

export type CategorizationSource = "rule" | "ai" | "user";
export type SupportedBank = "chase-us" | "uccu";

export type ParsedTransaction = {
  date: string;
  merchantRaw: string;
  amount: number;
};

export type NormalizedTransaction = {
  date: string;
  merchant_raw: string;
  merchant_normalized: string;
  amount: number;
};

export type CategorizedTransaction = NormalizedTransaction & {
  category: string;
  subcategory: string | null;
  confidence_score: number;
  categorization_source: CategorizationSource;
};

export type StatementRecord = {
  id: string;
  bank: SupportedBank;
  file_name: string;
  statement_month: number;
  statement_year: number;
  uploaded_at: string;
  processing_status: ProcessingStatus;
};
