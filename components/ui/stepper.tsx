"use client"

import type React from "react"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface StepperProps {
  steps: string[]
  currentStep: number
  onStepClick?: (step: number) => void
}

export function Stepper({ steps, currentStep, onStepClick }: StepperProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center">
            {/* Step circle */}
            <button
              onClick={() => onStepClick && index <= currentStep && onStepClick(index)}
              disabled={!onStepClick || index > currentStep}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors",
                index < currentStep
                  ? "bg-primary border-primary text-primary-foreground"
                  : index === currentStep
                    ? "border-primary text-primary"
                    : "border-muted text-muted-foreground",
                onStepClick && index <= currentStep ? "cursor-pointer" : "cursor-default",
              )}
            >
              {index < currentStep ? <Check className="h-4 w-4" /> : <span>{index + 1}</span>}
            </button>

            {/* Step label */}
            <span
              className={cn(
                "text-xs mt-2 font-medium",
                index === currentStep ? "text-primary" : "text-muted-foreground",
              )}
            >
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export interface StepContentProps {
  step: number
  currentStep: number
  children: React.ReactNode
}

export function StepContent({ step, currentStep, children }: StepContentProps) {
  if (step !== currentStep) return null
  return <div className="mt-8">{children}</div>
}
