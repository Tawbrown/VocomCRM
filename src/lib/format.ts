const compactCurrency = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 1
});

export function formatCompact(n: number): string {
  return compactCurrency.format(n);
}
