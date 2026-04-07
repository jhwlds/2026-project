import type { ParsedTransaction } from "@/types/domain";

import {
  BaseStatementParser,
  type ParseStatementInput,
  type ParseStatementResult,
} from "./baseStatementParser";

const MONTHS: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

export class ChaseUsParser extends BaseStatementParser {
  bankId = "chase-us" as const;
  parserVersion = "chase-us-v1";

  parse(input: ParseStatementInput): ParseStatementResult {
    const { rawText } = input;
    const statementPeriod = this.extractStatementPeriod(rawText);
    const lines = rawText.split(/\r?\n/).map((line) => line.trim());

    const transactions: ParsedTransaction[] = [];
    for (const line of lines) {
      const parsed = this.parseTransactionLine(
        line,
        statementPeriod.year,
        statementPeriod.month,
      );
      if (parsed) {
        transactions.push(parsed);
      }
    }

    if (transactions.length === 0) {
      throw new Error("No transaction rows detected for Chase format.");
    }

    return {
      transactions,
      statementMonth: statementPeriod.month,
      statementYear: statementPeriod.year,
    };
  }

  private extractStatementPeriod(rawText: string): { month: number; year: number } {
    // Typical statement line:
    // "Opening/Closing Date 02/01/24 - 02/29/24"
    const periodMatch = rawText.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s*-\s*(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);

    if (periodMatch) {
      const month = Number(periodMatch[4]);
      const year = normalizeYear(Number(periodMatch[6]));
      return { month, year };
    }

    // Fallback: "Statement Date: Mar 31, 2024"
    const statementDateMatch = rawText.match(
      /statement\s+date[:\s]+([a-z]{3,9})\s+\d{1,2},\s+(\d{4})/i,
    );
    if (statementDateMatch) {
      const monthToken = statementDateMatch[1].slice(0, 3).toLowerCase();
      const month = MONTHS[monthToken];
      const year = Number(statementDateMatch[2]);
      if (month) return { month, year };
    }

    throw new Error("Unable to detect statement month/year from PDF text.");
  }

  private parseTransactionLine(
    line: string,
    defaultYear: number,
    statementMonth: number,
  ): ParsedTransaction | null {
    // MVP regex for Chase-like row text:
    // "03/21 COSTCO WHSE #1234 123.45"
    // "03/22 AMAZON MKTPLACE PMTS -23.11"
    const match = line.match(
      /^(\d{1,2})\/(\d{1,2})\s+(.+?)\s+(-?\$?\d[\d,]*\.\d{2})$/,
    );
    if (!match) return null;

    const month = Number(match[1]);
    const day = Number(match[2]);
    const merchantRaw = match[3].trim();
    const year = month > statementMonth ? defaultYear - 1 : defaultYear;

    // Exclude payment/credit rows from spending analytics for MVP.
    if (/^payment\s+thank\s+you-?mobile$/i.test(merchantRaw)) {
      return null;
    }

    const amountRaw = match[4].replace("$", "").replace(/,/g, "");
    const amount = Number(amountRaw);

    if (!Number.isFinite(amount)) {
      return null;
    }

    return {
      date: toIsoDate(year, month, day),
      merchantRaw,
      amount,
    };
  }
}

function normalizeYear(year: number) {
  if (year < 100) return year + 2000;
  return year;
}

function toIsoDate(year: number, month: number, day: number) {
  const paddedMonth = String(month).padStart(2, "0");
  const paddedDay = String(day).padStart(2, "0");
  return `${year}-${paddedMonth}-${paddedDay}`;
}
