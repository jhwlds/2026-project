import type { SupportedBank } from "@/types/domain";

import type { BaseStatementParser } from "./baseStatementParser";
import { ChaseUsParser } from "./chaseUsParser";
import { UccuParser } from "./uccuParser";

const PARSER_FACTORIES: Record<SupportedBank, () => BaseStatementParser> = {
  "chase-us": () => new ChaseUsParser(),
  uccu: () => new UccuParser(),
};

export function getStatementParser(bank: SupportedBank): BaseStatementParser {
  return PARSER_FACTORIES[bank]();
}
