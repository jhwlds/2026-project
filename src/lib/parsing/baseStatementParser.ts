import type { ParsedTransaction } from "@/types/domain";

export type ParseStatementInput = {
  rawText: string;
};

export type ParseStatementResult = {
  transactions: ParsedTransaction[];
  statementMonth: number;
  statementYear: number;
};

export abstract class BaseStatementParser {
  abstract parserVersion: string;
  abstract parse(input: ParseStatementInput): ParseStatementResult;
}
