"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2 } from "lucide-react"

interface KeyValuePair {
  key: string
  value: string
}

interface KeyValueEditorProps {
  items: KeyValuePair[]
  onChange: (items: KeyValuePair[]) => void
  keyPlaceholder?: string
  valuePlaceholder?: string
}

export function KeyValueEditor({
  items,
  onChange,
  keyPlaceholder = "Key",
  valuePlaceholder = "Value",
}: KeyValueEditorProps) {
  const addItem = () => {
    onChange([...items, { key: "", value: "" }])
  }

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof KeyValuePair, value: string) => {
    const newItems = [...items]
    newItems[index][field] = value
    onChange(newItems)
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="flex gap-2">
          <Input
            placeholder={keyPlaceholder}
            value={item.key}
            onChange={(e) => updateItem(index, "key", e.target.value)}
            className="flex-1"
          />
          <Input
            placeholder={valuePlaceholder}
            value={item.value}
            onChange={(e) => updateItem(index, "value", e.target.value)}
            className="flex-1"
          />
          <Button variant="ghost" size="sm" onClick={() => removeItem(index)} disabled={items.length === 1}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addItem}>
        <Plus className="h-4 w-4 mr-2" />
        Add {keyPlaceholder}
      </Button>
    </div>
  )
}
