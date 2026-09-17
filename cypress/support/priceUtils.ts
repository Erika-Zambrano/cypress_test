export function parsePriceLabelToNumber(rawPriceLabel: string): number {
  const numericMatch = rawPriceLabel.match(/\d+(\.\d+)?/);

  if (!numericMatch) {
    throw new Error(`Unable to extract a numeric price from label: "${rawPriceLabel}"`);
  }

  return Number(numericMatch[0]);
}
