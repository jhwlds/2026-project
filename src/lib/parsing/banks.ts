import type { SupportedBank } from "@/types/domain";

export const SUPPORTED_BANKS = [
  {
    id: "chase-us",
    label: "Chase (US credit card)",
  },
  {
    id: "uccu",
    label: "UCCU (checking)",
  },
] as const satisfies ReadonlyArray<{ id: SupportedBank; label: string }>;

export function isSupportedBank(value: string): value is SupportedBank {
  return SUPPORTED_BANKS.some((bank) => bank.id === value);
}

export function getBankLabel(bank: SupportedBank) {
  return SUPPORTED_BANKS.find((item) => item.id === bank)?.label ?? bank;
}
