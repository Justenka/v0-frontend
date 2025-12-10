// types/currency.ts

/**
 * Valiutos tipas iš backend DB
 */
export interface Currency {
  id_valiuta: number
  name: string
  santykis: number
}

/**
 * Valiutos konvertavimo atsakymas
 */
export interface CurrencyConversionResponse {
  amount: number
  fromCurrency: number
  fromCurrencyName?: string
  toCurrency: number
  toCurrencyName?: string
  rate?: number
}