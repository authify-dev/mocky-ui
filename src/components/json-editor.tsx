"use client"

import { useState, useEffect } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Check } from "lucide-react"

interface JsonEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function JsonEditor({ value, onChange, placeholder }: JsonEditorProps) {
  const [error, setError] = useState<string | null>(null)
  const [isValid, setIsValid] = useState(true)

  useEffect(() => {
    if (!value.trim()) {
      setError(null)
      setIsValid(true)
      return
    }

    try {
      JSON.parse(value)
      setError(null)
      setIsValid(true)
    } catch (e) {
      setError((e as Error).message)
      setIsValid(false)
    }
  }, [value])

  return (
    <div className="space-y-3">
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`font-mono text-sm min-h-32 ${
            error ? "border-destructive" : isValid && value.trim() ? "border-green-500" : ""
          }`}
          rows={8}
        />
        {isValid && value.trim() && (
          <div className="absolute top-2 right-2">
            <Check className="h-4 w-4 text-green-500" />
          </div>
        )}
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>JSON Error: {error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
