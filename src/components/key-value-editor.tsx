"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"

type KV = { key: string; value: string }

type KeyValueEditorProps = {
  items: KV[]
  onChange: (items: KV[]) => void
  keyPlaceholder?: string
  valuePlaceholder?: string
  /** Habilita el ícono de basura incluso si solo hay una fila */
  allowDeleteLast?: boolean
}

export function KeyValueEditor({
  items,
  onChange,
  keyPlaceholder = "Key",
  valuePlaceholder = "Value",
  allowDeleteLast = false,
}: KeyValueEditorProps) {
  const handleAdd = () => onChange([...(items ?? []), { key: "", value: "" }])

  const handleUpdate =
    (idx: number, field: keyof KV) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = [...items]
      next[idx] = { ...next[idx], [field]: e.target.value }
      onChange(next)
    }

  const handleDelete = (idx: number) => {
    const next = items.filter((_, i) => i !== idx)
    onChange(next)
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="text-sm text-muted-foreground">No entries</div>
        ) : (
          items.map((item, idx) => {
            const canDelete = allowDeleteLast || items.length > 1
            return (
              <div key={idx} className="grid grid-cols-12 gap-2">
                <Input
                  className="col-span-5"
                  placeholder={keyPlaceholder}
                  value={item.key}
                  onChange={handleUpdate(idx, "key")}
                />
                <Input
                  className="col-span-6"
                  placeholder={valuePlaceholder}
                  value={item.value}
                  onChange={handleUpdate(idx, "value")}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="col-span-1"
                  onClick={() => handleDelete(idx)}
                  disabled={!canDelete}
                  title={canDelete ? "Eliminar" : "No puedes eliminar la última fila"}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )
          })
        )}
      </div>

      <div>
        <Button type="button" variant="secondary" onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Añadir
        </Button>
      </div>
    </div>
  )
}
