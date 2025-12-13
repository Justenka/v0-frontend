export interface Currency {
  id: number
  code: string
  name: string
  symbol: string
  exchangeRate: number
}

export interface ExchangeRates {
  base: string
  rates: Record<string, number>
  timestamp: number
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"  // EXPRESS API

// Fetch currencies from your Express backend
export async function fetchCurrenciesFromDB(): Promise<Currency[]> {
  try {
    const response = await fetch(`${API_BASE}/api/valiutos`)
    if (!response.ok) throw new Error("Failed to fetch currencies")

    const data = await response.json()

    return data.map((curr: any) => ({
      id: curr.id_valiuta,
      code: curr.name,
      name: getCurrencyName(curr.name),
      symbol: getCurrencySymbol(curr.name),
      exchangeRate: curr.santykis,
    }))
  } catch (error) {
    console.error("ERROR FETCHING CURRENCIES:", error)

    // Fallback
    return [
      { id: 1, code: "EUR", symbol: "€", name: "Euro", exchangeRate: 1 },
      { id: 2, code: "USD", symbol: "$", name: "US Dollar", exchangeRate: 1.09 },
      { id: 3, code: "PLN", symbol: "zł", name: "Polish Zloty", exchangeRate: 4.23 },
      { id: 4, code: "GBP", symbol: "£", name: "British Pound", exchangeRate: 0.85 },
      { id: 5, code: "JPY", symbol: "¥", name: "Japanese Yen", exchangeRate: 145.0 },
    ]
  }
}

// Always fetch fresh currencies — no caching
export async function getSupportedCurrencies(): Promise<Currency[]> {
  return await fetchCurrenciesFromDB()
}

// Build exchange rates
export async function getExchangeRates(): Promise<ExchangeRates> {
  const currencies = await getSupportedCurrencies()
  const rates: Record<string, number> = {}

  currencies.forEach(c => {
    rates[c.code] = c.exchangeRate
  })

  return {
    base: "EUR",
    rates,
    timestamp: Date.now()
  }
}

// Convert currency
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: ExchangeRates
): number {
  if (fromCurrency === toCurrency) return amount

  const amountInBase =
    fromCurrency === rates.base
      ? amount
      : amount / rates.rates[fromCurrency]

  const converted =
    toCurrency === rates.base
      ? amountInBase
      : amountInBase * rates.rates[toCurrency]

  return Math.round(converted * 100) / 100
}

export function formatCurrencyAmount(amount: number, currencyCode: string): string {
  return new Intl.NumberFormat("lt-LT", {
    style: "currency",
    currency: currencyCode,
  }).format(amount)
}

// Helpers
function getCurrencyName(code: string): string {
  const names: Record<string, string> = {
    EUR: "Euro",
    USD: "US Dollar",
    PLN: "Polish Zloty",
    GBP: "British Pound",
    JPY: "Japanese Yen",
  }
  return names[code] || code
}

function getCurrencySymbol(code: string): string {
  const symbols: Record<string, string> = {
    EUR: "€",
    USD: "$",
    PLN: "zł",
    GBP: "£",
    JPY: "¥",
  }
  return symbols[code] || code
}

// BACKWARD COMPAT
export let supportedCurrencies: Currency[] = []

// Load at start
fetchCurrenciesFromDB().then(c => (supportedCurrencies = c))
