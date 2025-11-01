// Currency conversion using real-time exchange rates
// Using exchangerate-api.com (free tier: 1,500 requests/month)

export interface ExchangeRates {
  base: string
  rates: Record<string, number>
  timestamp: number
}

const CACHE_KEY = "exchange_rates_cache"
const CACHE_DURATION = 3600000 // 1 hour in milliseconds

// Mock exchange rates for development
const mockRates: ExchangeRates = {
  base: "EUR",
  rates: {
    EUR: 1,
    USD: 1.09,
    GBP: 0.86,
    PLN: 4.32,
    SEK: 11.35,
    NOK: 11.68,
    DKK: 7.46,
    CHF: 0.94,
    CZK: 24.72,
    HUF: 389.45,
    RON: 4.97,
    BGN: 1.96,
    HRK: 7.53,
    RSD: 117.23,
    TRY: 37.42,
    RUB: 105.23,
    UAH: 44.87,
    JPY: 163.45,
    CNY: 7.89,
    INR: 91.23,
    BRL: 6.12,
    MXN: 18.67,
    CAD: 1.52,
    AUD: 1.68,
    NZD: 1.81,
    ZAR: 19.87,
  },
  timestamp: Date.now(),
}

export async function getExchangeRates(): Promise<ExchangeRates> {
  // Check cache first
  const cached = localStorage.getItem(CACHE_KEY)
  if (cached) {
    const data: ExchangeRates = JSON.parse(cached)
    if (Date.now() - data.timestamp < CACHE_DURATION) {
      return data
    }
  }

  // For now, return mock data
  // In production, uncomment the API call below:

  /*
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/EUR')
    if (!response.ok) throw new Error('Failed to fetch exchange rates')
    
    const data = await response.json()
    const rates: ExchangeRates = {
      base: data.base,
      rates: data.rates,
      timestamp: Date.now()
    }
    
    // Cache the rates
    localStorage.setItem(CACHE_KEY, JSON.stringify(rates))
    return rates
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error)
    // Fallback to mock data
    return mockRates
  }
  */

  // Cache mock data
  localStorage.setItem(CACHE_KEY, JSON.stringify(mockRates))
  return mockRates
}

export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: ExchangeRates,
): number {
  if (fromCurrency === toCurrency) return amount

  // Convert to base currency (EUR) first, then to target currency
  const amountInBase = fromCurrency === rates.base ? amount : amount / rates.rates[fromCurrency]

  const convertedAmount = toCurrency === rates.base ? amountInBase : amountInBase * rates.rates[toCurrency]

  return Math.round(convertedAmount * 100) / 100
}

export const supportedCurrencies = [
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "PLN", symbol: "zł", name: "Polish Zloty" },
  { code: "SEK", symbol: "kr", name: "Swedish Krona" },
  { code: "NOK", symbol: "kr", name: "Norwegian Krone" },
  { code: "DKK", symbol: "kr", name: "Danish Krone" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc" },
  { code: "CZK", symbol: "Kč", name: "Czech Koruna" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
]

export function formatCurrencyAmount(amount: number, currencyCode: string): string {
  const currency = supportedCurrencies.find((c) => c.code === currencyCode)
  if (!currency) return `${amount.toFixed(2)} ${currencyCode}`

  return new Intl.NumberFormat("lt-LT", {
    style: "currency",
    currency: currencyCode,
  }).format(amount)
}
