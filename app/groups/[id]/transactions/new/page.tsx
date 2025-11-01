"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeftCircle, ArrowRight, Check, ChevronsLeft, DollarSign } from "lucide-react"
import type { Member } from "@/types/member"
import { userApi, groupApi } from "@/services/api-client"
import { Stepper, StepContent } from "@/components/ui/stepper"
import { CurrencyConverterDialog } from "@/components/currency-converter-dialog"
import { supportedCurrencies } from "@/lib/currency-api"

export default function NewTransactionPage() {
  const params = useParams()
  const router = useRouter()
  const groupId = Number(params.id)

  const [title, setTitle] = useState("")
  const [amount, setAmount] = useState("")
  const [paidBy, setPaidBy] = useState("")
  const [splitType, setSplitType] = useState("equal")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [members, setMembers] = useState<Member[]>([])
  const [userName, setUserName] = useState("")
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [currency, setCurrency] = useState("EUR")
  const [enableLateFee, setEnableLateFee] = useState(false)
  const [lateFeeAmount, setLateFeeAmount] = useState("")
  const [lateFeeDays, setLateFeeDays] = useState("7")
  const [isCurrencyConverterOpen, setIsCurrencyConverterOpen] = useState(false)

  // Stepper state
  const [currentStep, setCurrentStep] = useState(0)
  const steps = ["Details", "Paid By", "Split", "Review"]

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const name = await userApi.getUserName()
        setUserName(name)
      } catch (error) {
        console.error("Failed to fetch user name:", error)
      } finally {
        setIsLoadingUser(false)
      }
    }

    fetchUserName()
  }, [])

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const data = await groupApi.getGroup(groupId)
        if (data) {
          setMembers(data.members || [])
        }
      } catch (error) {
        console.error("Error loading members:", error)
      }
    }

    if (groupId) fetchMembers()
  }, [groupId])

  const [percentages, setPercentages] = useState<Record<number, string>>({})
  const [amounts, setAmounts] = useState<Record<number, string>>({})

  // Step validation
  const canGoToNextStep = () => {
    switch (currentStep) {
      case 0: // Details
        return title.trim() !== "" && amount.trim() !== "" && Number.parseFloat(amount) > 0
      case 1: // Paid By
        return paidBy !== ""
      case 2: // Split
        if (splitType === "equal") return true
        if (splitType === "percentage") return isPercentageValid()
        if (splitType === "dynamic") return isDynamicValid()
        return false
      case 3: // Review
        return true
      default:
        return false
    }
  }

  // Navigation functions
  const goToNextStep = () => {
    if (currentStep < steps.length - 1 && canGoToNextStep()) {
      setCurrentStep(currentStep + 1)
    }
  }

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const goToStep = (step: number) => {
    // Only allow going to steps that are valid to navigate to
    if (step <= currentStep || (step === currentStep + 1 && canGoToNextStep())) {
      setCurrentStep(step)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (currentStep < steps.length - 1) {
      goToNextStep()
      return
    }

    if (!title.trim() || !amount || !paidBy) return
    if (!userName) {
      alert("Please set your name before creating a transaction")
      router.push("/")
      return
    }

    setIsSubmitting(true)

    try {
      let splitTypeDescription = "Equally"
      if (splitType === "equal") {
        splitTypeDescription = `Equally among ${members.length} people`
      } else if (splitType === "percentage") {
        splitTypeDescription = "By percentage"
      } else if (splitType === "dynamic") {
        splitTypeDescription = "Custom amounts"
      }

      await groupApi.addTransaction(groupId, title, Number.parseFloat(amount), paidBy, splitTypeDescription)

      router.push(`/groups/${groupId}`)
    } catch (error) {
      console.error("Failed to create transaction:", error)
      alert("Failed to add expense.")
      setIsSubmitting(false)
    }
  }

  const handlePercentageChange = (memberId: number, value: string) => {
    setPercentages({
      ...percentages,
      [memberId]: value,
    })
  }

  const handleAmountChange = (memberId: number, value: string) => {
    setAmounts({
      ...amounts,
      [memberId]: value,
    })
  }

  const isPercentageValid = () => {
    if (splitType !== "percentage") return true
    const total = Object.values(percentages).reduce((sum, val) => sum + Number.parseFloat(val || "0"), 0)
    return Math.abs(total - 100) < 0.01
  }

  const isDynamicValid = () => {
    if (splitType !== "dynamic") return true
    const totalSplit = Object.values(amounts).reduce((sum, val) => sum + Number.parseFloat(val || "0"), 0)
    return Math.abs(totalSplit - Number.parseFloat(amount || "0")) < 0.01
  }

  // Calculate split amounts for display in review step
  const calculateSplitAmounts = () => {
    if (!amount || isNaN(Number.parseFloat(amount))) return []

    const totalAmount = Number.parseFloat(amount)

    if (splitType === "equal") {
      const perPerson = totalAmount / members.length
      return members.map((member) => ({
        name: member.name,
        amount: perPerson,
      }))
    }

    if (splitType === "percentage") {
      return members.map((member) => {
        const percentage = Number.parseFloat(percentages[member.id] || "0")
        return {
          name: member.name,
          amount: (totalAmount * percentage) / 100,
        }
      })
    }

    if (splitType === "dynamic") {
      return members.map((member) => ({
        name: member.name,
        amount: Number.parseFloat(amounts[member.id] || "0"),
      }))
    }

    return []
  }

  return (
    <div className="container max-w-2xl py-10 mx-auto px-4">
      <Link
        href={`/groups/${groupId}`}
        className="text-muted-foreground hover:text-foreground inline-flex items-center mb-6"
      >
        <ArrowLeftCircle className="mr-2 h-4 w-4" />
        Back to Group
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Add New Expense</CardTitle>
          <CardDescription>Record a new expense for your group.</CardDescription>
          <div className="mt-6">
            <Stepper steps={steps} currentStep={currentStep} onStepClick={goToStep} />
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 pt-6">
            {/* Step 1: Transaction Details */}
            <StepContent step={0} currentStep={currentStep}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Expense Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Dinner, Groceries, Movie tickets"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Total Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Valiuta</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger id="currency" className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {supportedCurrencies.map((curr) => (
                          <SelectItem key={curr.code} value={curr.code}>
                            {curr.symbol} {curr.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCurrencyConverterOpen(true)}
                  className="w-full"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Valiutos konverteris
                </Button>

                <div className="border-t pt-4 space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="enable-late-fee"
                      checked={enableLateFee}
                      onCheckedChange={(checked) => setEnableLateFee(checked as boolean)}
                    />
                    <Label htmlFor="enable-late-fee" className="cursor-pointer">
                      Pridėti delspinigius
                    </Label>
                  </div>

                  {enableLateFee && (
                    <div className="grid grid-cols-2 gap-4 pl-6">
                      <div className="space-y-2">
                        <Label htmlFor="late-fee-amount">Delspinigių suma</Label>
                        <Input
                          id="late-fee-amount"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={lateFeeAmount}
                          onChange={(e) => setLateFeeAmount(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="late-fee-days">Po dienų</Label>
                        <Input
                          id="late-fee-days"
                          type="number"
                          min="1"
                          placeholder="7"
                          value={lateFeeDays}
                          onChange={(e) => setLateFeeDays(e.target.value)}
                        />
                      </div>
                      <p className="text-xs text-gray-600 col-span-2">
                        Delspinigiai bus pridėti automatiškai po {lateFeeDays} dienų
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </StepContent>

            {/* Step 2: Who Paid */}
            <StepContent step={1} currentStep={currentStep}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="paidBy">Who paid for this expense?</Label>
                  <Select value={paidBy} onValueChange={setPaidBy}>
                    <SelectTrigger id="paidBy">
                      <SelectValue placeholder="Select who paid" />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map((member) => (
                        <SelectItem key={member.id} value={member.name}>
                          {member.name === userName ? "You" : member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </StepContent>

            {/* Step 3: Split Method */}
            <StepContent step={2} currentStep={currentStep}>
              <div className="space-y-4">
                <Label>How to Split</Label>
                <Tabs value={splitType} onValueChange={setSplitType} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="equal">Equal</TabsTrigger>
                    <TabsTrigger value="percentage">Percentage</TabsTrigger>
                    <TabsTrigger value="dynamic">Dynamic</TabsTrigger>
                  </TabsList>

                  <TabsContent value="equal" className="pt-4">
                    <p className="text-sm text-muted-foreground">
                      The total amount will be split equally among all members.
                    </p>
                    {amount && (
                      <div className="mt-4 p-4 bg-muted rounded-md">
                        <p className="font-medium">
                          Each person pays: {formatCurrency(Number.parseFloat(amount) / members.length, currency)}
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="percentage" className="pt-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Specify what percentage each person should pay (total must be 100%).
                    </p>
                    <div className="space-y-3">
                      {members.map((member) => (
                        <div key={member.id} className="flex items-center gap-4">
                          <Label className="w-24">{member.name}</Label>
                          <div className="flex-1">
                            <div className="flex items-center">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                placeholder="0"
                                value={percentages[member.id] || ""}
                                onChange={(e) => handlePercentageChange(member.id, e.target.value)}
                              />
                              <span className="ml-2">%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Show total percentage */}
                    <div className="mt-4 p-4 bg-muted rounded-md">
                      <p className="font-medium">
                        Total:{" "}
                        {Object.values(percentages)
                          .reduce((sum, value) => sum + (Number.parseFloat(value) || 0), 0)
                          .toFixed(2)}
                        %
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="dynamic" className="pt-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Specify the exact amount each person should pay (total must match expense amount).
                    </p>
                    <div className="space-y-3">
                      {members.map((member) => (
                        <div key={member.id} className="flex items-center gap-4">
                          <Label className="w-24">{member.name}</Label>
                          <div className="flex-1">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              value={amounts[member.id] || ""}
                              onChange={(e) => handleAmountChange(member.id, e.target.value)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Show total amount */}
                    <div className="mt-4 p-4 bg-muted rounded-md flex justify-between">
                      <p className="font-medium">
                        Total:{" "}
                        {formatCurrency(
                          Object.values(amounts).reduce((sum, value) => sum + (Number.parseFloat(value) || 0), 0),
                          currency,
                        )}
                      </p>
                      <p className="font-medium">
                        Expense amount:{" "}
                        {amount ? formatCurrency(Number.parseFloat(amount), currency) : `${currency} 0.00`}
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </StepContent>

            {/* Step 4: Review */}
            <StepContent step={3} currentStep={currentStep}>
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Review Your Expense</h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Expense</p>
                      <p className="font-medium">{title}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Amount</p>
                      <p className="font-medium">{formatCurrency(Number.parseFloat(amount), currency)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Paid by</p>
                      <p className="font-medium">{paidBy === userName ? "You" : paidBy}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Split method</p>
                      <p className="font-medium capitalize">{splitType}</p>
                    </div>
                  </div>

                  {enableLateFee && lateFeeAmount && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-yellow-900">
                        Delspinigiai: {formatCurrency(Number.parseFloat(lateFeeAmount), currency)} po {lateFeeDays}{" "}
                        dienų
                      </p>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-2">Split details:</p>
                    <div className="space-y-2">
                      {calculateSplitAmounts().map((split, index) => (
                        <div key={index} className="flex justify-between">
                          <span>{split.name === userName ? "You" : split.name}</span>
                          <span>{formatCurrency(split.amount, currency)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </StepContent>
          </CardContent>
          <CardFooter className="flex justify-between">
            {currentStep > 0 ? (
              <Button type="button" variant="outline" onClick={goToPreviousStep}>
                <ChevronsLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={() => router.push(`/groups/${groupId}`)}>
                Cancel
              </Button>
            )}

            {currentStep < steps.length - 1 ? (
              <Button type="submit" disabled={!canGoToNextStep()}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  !title.trim() ||
                  !amount ||
                  !paidBy ||
                  isLoadingUser ||
                  !userName ||
                  !isPercentageValid() ||
                  !isDynamicValid()
                }
              >
                {isSubmitting ? "Adding..." : "Add Expense"}
                <Check className="ml-2 h-4 w-4" />
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>

      <CurrencyConverterDialog open={isCurrencyConverterOpen} onOpenChange={setIsCurrencyConverterOpen} />
    </div>
  )
}

function formatCurrency(amount: number, currencyCode = "EUR"): string {
  return new Intl.NumberFormat("lt-LT", {
    style: "currency",
    currency: currencyCode,
  }).format(amount)
}
