export function fmtPrice(val: number | null): string {
  if (val == null) return 'N/A';
  return `$${val.toFixed(2)}`;
}

export function fmtCap(val: number | null): string {
  if (val == null) return 'N/A';
  if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
  if (val >= 1e3) return `$${(val / 1e3).toFixed(0)}K`;
  return `$${val.toFixed(0)}`;
}

export function fmtVol(val: number | null): string {
  if (val == null) return 'N/A';
  if (val >= 1e6) return `${(val / 1e6).toFixed(2)}M`;
  if (val >= 1e3) return `${(val / 1e3).toFixed(0)}K`;
  return val.toFixed(0);
}

export function fmtPct(val: number | null): string {
  if (val == null) return 'N/A';
  const sign = val >= 0 ? '+' : '';
  return `${sign}${val.toFixed(2)}%`;
}
