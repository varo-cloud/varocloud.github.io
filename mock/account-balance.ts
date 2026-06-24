let accountBalanceUsd = 12.4

export function getAccountBalanceUsd(): number {
  return accountBalanceUsd
}

export function addAccountBalanceUsd(amount: number): number {
  accountBalanceUsd = Number((accountBalanceUsd + amount).toFixed(2))
  return accountBalanceUsd
}

export function setAccountBalanceUsd(amount: number): void {
  accountBalanceUsd = Number(amount.toFixed(2))
}
