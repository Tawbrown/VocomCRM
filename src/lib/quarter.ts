export function quarterLabel(dateStr: string): string {
  const [year, month] = dateStr.split('-').map(Number);
  const quarter = Math.floor((month - 1) / 3) + 1;
  return `${year} Q${quarter}`;
}
