export function formatFollowerCount(count: number | null): string | null {
  if (count === null || count === undefined) return null;
  if (count < 1000) return String(count);
  if (count < 1_000_000) return `${(count / 1000).toFixed(count % 1000 === 0 ? 0 : 1)}K`;
  return `${(count / 1_000_000).toFixed(count % 1_000_000 === 0 ? 0 : 1)}M`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  const units: [number, string][] = [
    [60, 'second'], [60, 'minute'], [24, 'hour'], [7, 'day'], [4.345, 'week'], [12, 'month'], [Number.POSITIVE_INFINITY, 'year'],
  ];
  let value = seconds;
  for (const [amount, unit] of units) {
    if (value < amount) {
      const rounded = Math.floor(value);
      return `${rounded} ${unit}${rounded !== 1 ? 's' : ''} ago`;
    }
    value /= amount;
  }
  return 'just now';
}
