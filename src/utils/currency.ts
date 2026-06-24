/** Format a USD amount for display (e.g. `$17.50`). */
export function formatUsd(value: number): string {
  return `$${value.toFixed(2)}`
}
