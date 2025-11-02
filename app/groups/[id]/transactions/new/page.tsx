"use client"

import type React from "react"
import toast from "react-hot-toast"

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
import { mockCategories } from "@/lib/mock-data"

export default function NaujaIslaidaPuslapis() {
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
  const [categoryId, setCategoryId] = useState("")
  const [newCategoryName, setNewCategoryName] = useState("")
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])

  const [currentStep, setCurrentStep] = useState(0)
  const steps = ["Duomenys", "Kas mokėjo", "Dalinimas", "Peržiūra"]

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const name = await userApi.getUserName()
        setUserName(name)
      } catch (error) {
        console.error("Nepavyko gauti vartotojo vardo:", error)
      } finally {
        setIsLoadingUser(false)
      }
    }

    fetchUserName()
  }, [])

  useEffect(() => {
    try {
      const groupKey = String(groupId)
      const groupCategories = mockCategories[groupKey] || []
      setCategories(groupCategories)
    } catch (error) {
      console.error("Nepavyko įkelti kategorijų:", error)
    }
  }, [groupId])

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const data = await groupApi.getGroup(groupId)
        if (data) {
          setMembers(data.members || [])
        }
      } catch (error) {
        console.error("Klaida įkeliant narius:", error)
      }
    }

    if (groupId) fetchMembers()
  }, [groupId])

  const [percentages, setPercentages] = useState<Record<number, string>>({})
  const [amounts, setAmounts] = useState<Record<number, string>>({})

  const canGoToNextStep = () => {
    switch (currentStep) {
      case 0:
        return title.trim() !== "" && amount.trim() !== "" && Number.parseFloat(amount) > 0
      case 1:
        return paidBy !== ""
      case 2:
        if (splitType === "equal") return true
        if (splitType === "percentage") return isPercentageValid()
        if (splitType === "dynamic") return isDynamicValid()
        return false
      default:
        return true
    }
  }

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
      alert("Prieš kuriant išlaidą, nustatykite savo vardą")
      router.push("/")
      return
    }

    setIsSubmitting(true)

    try {
      let splitTypeDescription = "Lygiomis dalimis"
      if (splitType === "percentage") {
        splitTypeDescription = "Pagal procentus"
      } else if (splitType === "dynamic") {
        splitTypeDescription = "Pagal konkrečias sumas"
      }

      await groupApi.addTransaction(groupId, title, Number.parseFloat(amount), paidBy, splitTypeDescription, categoryId)

      toast.success("Išlaida sėkmingai pridėta!")
      router.push(`/groups/${groupId}`)
    } catch (error) {
      console.error("Nepavyko sukurti išlaidos:", error)
      toast.error("Nepavyko pridėti išlaidos.")
      setIsSubmitting(false)
    }
  }

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) return

    const newCategory = {
      id: `c${Date.now()}`,
      name: newCategoryName,
    }
    setCategories([...categories, newCategory])
    setCategoryId(newCategory.id)
    setNewCategoryName("")
    setIsCreatingCategory(false)
    toast.success("Kategorija sukurta")
  }

  const handlePercentageChange = (memberId: number, value: string) => {
    setPercentages({ ...percentages, [memberId]: value })
  }

  const handleAmountChange = (memberId: number, value: string) => {
    setAmounts({ ...amounts, [memberId]: value })
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

  const calculateSplitAmounts = () => {
    if (!amount || isNaN(Number.parseFloat(amount))) return []
    const totalAmount = Number.parseFloat(amount)

    if (splitType === "equal") {
      const perPerson = totalAmount / members.length
      return members.map((member) => ({ name: member.name, amount: perPerson }))
    }

    if (splitType === "percentage") {
      return members.map((member) => {
        const percentage = Number.parseFloat(percentages[member.id] || "0")
        return { name: member.name, amount: (totalAmount * percentage) / 100 }
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
        Atgal į grupę
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Nauja išlaida</CardTitle>
          <CardDescription>Pridėkite naują grupės išlaidą.</CardDescription>
          <div className="mt-6">
            <Stepper steps={steps} currentStep={currentStep} onStepClick={goToStep} />
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 pt-6">
            {/* ŽINGSNIS 1: Išlaidos duomenys */}
            <StepContent step={0} currentStep={currentStep}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Pavadinimas</Label>
                  <Input
                    id="title"
                    placeholder="pvz., Vakarienė, Kuras, Bilietai į kiną"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Suma</Label>
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
                        <Label htmlFor="late-fee-days">Po kiek dienų</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="category">Kategorija</Label>
                  {!isCreatingCategory ? (
                    <div className="flex gap-2">
                      <Select value={categoryId} onValueChange={setCategoryId}>
                        <SelectTrigger id="category" className="flex-1">
                          <SelectValue placeholder="Pasirinkite kategoriją" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button type="button" variant="outline" onClick={() => setIsCreatingCategory(true)}>
                        Nauja
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Kategorijos pavadinimas"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            handleCreateCategory()
                          }
                        }}
                      />
                      <Button type="button" onClick={handleCreateCategory} disabled={!newCategoryName.trim()}>
                        Sukurti
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsCreatingCategory(false)
                          setNewCategoryName("")
                        }}
                      >
                        Atšaukti
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </StepContent>

            {/* ŽINGSNIS 2 */}
            <StepContent step={1} currentStep={currentStep}>
              <div className="space-y-4">
                <Label htmlFor="paidBy">Kas sumokėjo už šią išlaidą?</Label>
                <Select value={paidBy} onValueChange={setPaidBy}>
                  <SelectTrigger id="paidBy">
                    <SelectValue placeholder="Pasirinkite asmenį" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.name}>
                        {member.name === userName ? "Aš" : member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </StepContent>

            {/* ŽINGSNIS 3 */}
            <StepContent step={2} currentStep={currentStep}>
              <div className="space-y-4">
                <Label>Kaip padalinti</Label>
                <Tabs value={splitType} onValueChange={setSplitType} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="equal">Lygiomis</TabsTrigger>
                    <TabsTrigger value="percentage">Procentais</TabsTrigger>
                    <TabsTrigger value="dynamic">Pagal sumą</TabsTrigger>
                  </TabsList>

                  <TabsContent value="equal" className="pt-4">
                    <p className="text-sm text-muted-foreground">
                      Visa suma bus padalinta lygiomis dalimis tarp visų narių.
                    </p>
                    {amount && (
                      <div className="mt-4 p-4 bg-muted rounded-md">
                        <p className="font-medium">
                          Kiekvienas moka: {formatCurrency(Number.parseFloat(amount) / members.length, currency)}
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="percentage" className="pt-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Nurodykite, kokį procentą turi sumokėti kiekvienas (viso – 100%).
                    </p>
                    <div className="space-y-3">
                      {members.map((member) => (
                        <div key={member.id} className="flex items-center gap-4">
                          <Label className="w-24">{member.name}</Label>
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
                      ))}
                    </div>

                    <div className="mt-4 p-4 bg-muted rounded-md">
                      <p className="font-medium">
                        Iš viso:{" "}
                        {Object.values(percentages)
                          .reduce((sum, val) => sum + (Number.parseFloat(val) || 0), 0)
                          .toFixed(2)}
                        %
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="dynamic" className="pt-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Nurodykite konkrečią sumą kiekvienam asmeniui (viso turi atitikti bendrą sumą).
                    </p>
                    <div className="space-y-3">
                      {members.map((member) => (
                        <div key={member.id} className="flex items-center gap-4">
                          <Label className="w-24">{member.name}</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={amounts[member.id] || ""}
                            onChange={(e) => handleAmountChange(member.id, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Rodoma bendra suma */}
                    <div className="mt-4 p-4 bg-muted rounded-md flex justify-between">
                      <p className="font-medium">
                        Iš viso:{" "}
                        {formatCurrency(
                          Object.values(amounts).reduce((sum, val) => sum + (Number.parseFloat(val) || 0), 0),
                          currency,
                        )}
                      </p>
                      <p className="font-medium">
                        Išlaidos suma:{" "}
                        {amount ? formatCurrency(Number.parseFloat(amount), currency) : `${currency} 0.00`}
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </StepContent>

            {/* ŽINGSNIS 4: Peržiūra */}
            <StepContent step={3} currentStep={currentStep}>
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Peržiūrėkite išlaidą</h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Pavadinimas</p>
                      <p className="font-medium">{title}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Suma</p>
                      <p className="font-medium">{formatCurrency(Number.parseFloat(amount), currency)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Kas mokėjo</p>
                      <p className="font-medium">{paidBy === userName ? "Aš" : paidBy}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Dalinimo būdas</p>
                      <p className="font-medium capitalize">
                        {splitType === "equal"
                          ? "Lygiomis dalimis"
                          : splitType === "percentage"
                          ? "Procentais"
                          : "Pagal sumą"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Kategorija</p>
                      <p className="font-medium">{categories.find((cat) => cat.id === categoryId)?.name || "Nenurodyta"}</p>
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
                    <p className="text-sm font-medium mb-2">Dalinimo detalės:</p>
                    <div className="space-y-2">
                      {calculateSplitAmounts().map((split, index) => (
                        <div key={index} className="flex justify-between">
                          <span>{split.name === userName ? "Aš" : split.name}</span>
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
                Atgal
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={() => router.push(`/groups/${groupId}`)}>
                Atšaukti
              </Button>
            )}

            {currentStep < steps.length - 1 ? (
              <Button type="submit" disabled={!canGoToNextStep()}>
                Toliau
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
                {isSubmitting ? "Pridedama..." : "Pridėti išlaidą"}
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

                         
