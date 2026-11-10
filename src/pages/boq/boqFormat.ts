export function formatMoney(amount: number, currencyCode = 'ETB'): string {
  return `${new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)} ${currencyCode}`
}

export function numberInputValue(value: number): string {
  return Number.isFinite(value) ? String(value) : '0'
}
