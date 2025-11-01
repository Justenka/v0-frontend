"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowRightLeft, RefreshCw } from "lucide-react"
import {
  getExchangeRates,
  convertCurrency,
  supportedCurrencies,
  formatCurrencyAmount,
  type ExchangeRates,
} from "@/lib/currency-api"

interface CurrencyConverterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CurrencyConverterDialog({ open, onOpenChange }: CurrencyConverterDialogProps) {
  const [amount, setAmount] = useState("100")
  const [fromCurrency, setFromCurrency] = useState("EUR")
  const [toCurrency, setToCurrency] = useState("USD")
  const [rates, setRates] = useState<ExchangeRates | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null)

  useEffect(() => {
    if (open) {
      loadRates()
    }
  }, [open])

  useEffect(() => {
    if (rates && amount) {
      const result = convertCurrency(Number.parseFloat(amount), fromCurrency, toCurrency, rates)
      setConvertedAmount(result)
    }
  }, [amount, fromCurrency, toCurrency, rates])

  const loadRates = async () => {
    setIsLoading(true)
    try {
      const data = await getExchangeRates()
      setRates(data)
    } catch (error) {
      console.error("Failed to load exchange rates:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const swapCurrencies = () => {
    setFromCurrency(toCurrency)
    setToCurrency(fromCurrency)
  }

  const lastUpdated = rates ? new Date(rates.timestamp).toLocaleString("lt-LT") : ""

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Valiutos konvertavimas</DialogTitle>
          <DialogDescription>Konvertuokite sumas tarp skirtingų valiutų</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Suma</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end">
            <div className="space-y-2">
              <Label htmlFor="from-currency">Iš</Label>
              <Select value={fromCurrency} onValueChange={setFromCurrency}>
                <SelectTrigger id="from-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {supportedCurrencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button variant="ghost" size="icon" onClick={swapCurrencies} className="mb-0">
              <ArrowRightLeft className="h-4 w-4" />
            </Button>

            <div className="space-y-2">
              <Label htmlFor="to-currency">Į</Label>
              <Select value={toCurrency} onValueChange={setToCurrency}>
                <SelectTrigger id="to-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {supportedCurrencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {convertedAmount !== null && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 mb-1">Konvertuota suma:</p>
              <p className="text-2xl font-bold text-blue-900">{formatCurrencyAmount(convertedAmount, toCurrency)}</p>
            </div>
          )}

          {rates && (
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Atnaujinta: {lastUpdated}</span>
              <Button variant="ghost" size="sm" onClick={loadRates} disabled={isLoading}>
                <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? "animate-spin" : ""}`} />
                Atnaujinti
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Uždaryti
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
