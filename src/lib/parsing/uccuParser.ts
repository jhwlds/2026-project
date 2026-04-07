import type { ParsedTransaction } from "@/types/domain";

import {
  BaseStatementParser,
  type ParseStatementInput,
  type ParseStatementResult,
} from "./baseStatementParser";

const DATE_PREFIX_REGEX = /^(\d{2})\/(\d{2})(.*)$/;
const CURRENCY_REGEX = /\$?\d[\d,]*\.\d{2}/g;
const SECTION_END_REGEX = /^(?:Total For|SHARE SAVINGS)\b/i;
const NOISE_LINE_REGEXES = [
  /^Transaction\b/i,
  /^Date\b/i,
  /^Member Number\b/i,
  /^\d+\s+\d{2}-\d{2}-\d{4}\s+to\s+\d{2}-\d{2}-\d{4}\s+\d+\s+of\s+\d+$/i,
  /^-+Page\b/i,
];
const DEPOSIT_DESCRIPTION_REGEX = /^(?:Ext Dep\b|Deposit\b|ATM Deposit\b)/i;
const SKIP_DESCRIPTION_REGEX = /^(?:Beginning Balance\b|Dividend\b)/i;

export class UccuParser extends BaseStatementParser {
  bankId = "uccu" as const;
  parserVersion = "uccu-checking-v1";

  parse(input: ParseStatementInput): ParseStatementResult {
    const { rawText } = input;
    const statementPeriod = this.extractStatementPeriod(rawText);
    const lines = rawText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const checkingLines = this.collectCheckingLines(lines);

    if (checkingLines.length === 0) {
      throw new Error("No ELEVATED CHECKING section detected for UCCU format.");
    }

    const transactions: ParsedTransaction[] = [];
    let current: ParsedTransaction | null = null;

    for (const line of checkingLines) {
      if (this.isNoiseLine(line)) {
        continue;
      }

      if (DATE_PREFIX_REGEX.test(line)) {
        if (current) {
          transactions.push(finalizeTransaction(current));
        }
        current = this.parseTransactionLine(
          line,
          statementPeriod.year,
          statementPeriod.month,
        );
        continue;
      }

      if (current) {
        current = {
          ...current,
          merchantRaw: `${current.merchantRaw} ${line}`.replace(/\s{2,}/g, " ").trim(),
        };
      }
    }

    if (current) {
      transactions.push(finalizeTransaction(current));
    }

    if (transactions.length === 0) {
      throw new Error("No spending transactions detected for UCCU checking format.");
    }

    return {
      transactions,
      statementMonth: statementPeriod.month,
      statementYear: statementPeriod.year,
    };
  }

  private extractStatementPeriod(rawText: string): { month: number; year: number } {
    const match = rawText.match(
      /(\d{2})-(\d{2})-(\d{4})\s+to\s+(\d{2})-(\d{2})-(\d{4})/,
    );

    if (!match) {
      throw new Error("Unable to detect statement month/year from UCCU PDF text.");
    }

    return {
      month: Number(match[4]),
      year: Number(match[6]),
    };
  }

  private collectCheckingLines(lines: string[]) {
    const checkingLines: string[] = [];
    let inCheckingSection = false;

    for (const line of lines) {
      if (!inCheckingSection) {
        if (/^ELEVATED CHECKING\b/i.test(line)) {
          inCheckingSection = true;
        }
        continue;
      }

      if (SECTION_END_REGEX.test(line)) {
        break;
      }

      checkingLines.push(line);
    }

    return checkingLines;
  }

  private isNoiseLine(line: string) {
    return NOISE_LINE_REGEXES.some((regex) => regex.test(line));
  }

  private parseTransactionLine(
    line: string,
    defaultYear: number,
    statementMonth: number,
  ): ParsedTransaction | null {
    const match = line.match(DATE_PREFIX_REGEX);
    if (!match) return null;

    const month = Number(match[1]);
    const day = Number(match[2]);
    const remainder = match[3];
    const amounts = [...remainder.matchAll(CURRENCY_REGEX)];

    if (amounts.length < 2) {
      return null;
    }

    const descriptionStart = (amounts[1].index ?? 0) + amounts[1][0].length;
    const rawDescription = remainder.slice(descriptionStart).trim();

    if (!rawDescription) {
      return null;
    }

    if (
      DEPOSIT_DESCRIPTION_REGEX.test(rawDescription) ||
      SKIP_DESCRIPTION_REGEX.test(rawDescription)
    ) {
      return null;
    }

    const amount = parseCurrency(amounts[0][0]);
    const year = month > statementMonth ? defaultYear - 1 : defaultYear;

    return {
      date: toIsoDate(year, month, day),
      merchantRaw: cleanDescription(rawDescription),
      amount,
    };
  }
}

function cleanDescription(input: string) {
  return input
    .replace(/^(?:POS|Ext WD|Withdrawal)\s+/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function finalizeTransaction(transaction: ParsedTransaction): ParsedTransaction {
  return {
    ...transaction,
    merchantRaw: transaction.merchantRaw.replace(/\s{2,}/g, " ").trim(),
  };
}

function parseCurrency(value: string) {
  return Number(value.replace("$", "").replace(/,/g, ""));
}

function toIsoDate(year: number, month: number, day: number) {
  const paddedMonth = String(month).padStart(2, "0");
  const paddedDay = String(day).padStart(2, "0");
  return `${year}-${paddedMonth}-${paddedDay}`;
}
