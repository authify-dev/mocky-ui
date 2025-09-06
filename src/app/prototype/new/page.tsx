"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, Trash2, Copy, Save, Eye } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { KeyValueEditor } from "@/components/key-value-editor"
import { JsonEditor } from "@/components/json-editor"
import { RequestPreview } from "@/components/request-preview"

type KVItem = { key: string; value: string }
type QueryItem = { key: string; value: string; regex: string }

function kvToObject(kv: KVItem[]) {
  return kv
    .filter(({ key }) => key && key.trim() !== "")
    .reduce<Record<string, string>>((acc, { key, value }) => {
      acc[key] = value ?? ""
      return acc
    }, {})
}

function safeParseJson<T = any>(raw: string, fallback: T): T {
  try {
    const v = raw?.trim()
    if (!v) return fallback
    return JSON.parse(v)
  } catch {
    return fallback
  }
}

export default function NewPrototype() {
  const [activeTab, setActiveTab] = useState("request")
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: "Example",
    method: "GET",
    urlPath: "/v1/health",
    delay: 200, // ms
    headers: [{ key: "Content-Type", value: "application/json" }] as KVItem[],
    queryParams: [{ key: "", value: "", regex: "" }] as QueryItem[],
    // Un bodySchema de ejemplo válido para signin por email:
    bodySchema: JSON.stringify(
      {
        name: "SignupSchema",
        type_schema: "object",
        aditional_properties: false,
        properties: [
          {
            name: "email",
            is_required: true,
            type: "string",
            min_length: 5,
            max_length: 255,
            format: "email",
          },
        ],
      },
      null,
      2
    ),
    responseStatus: 200,
    responseHeaders: [{ key: "Content-Type", value: "application/json" }] as KVItem[],
    // Respuesta de ejemplo con placeholders:
    responseBody: JSON.stringify(
      {
        data: {
          jwt: "{{random.JWT}}",
          email: "{{random.email}}",
          image_profile: "{{random.URL}}",
        },
        status_code: 200,
        success: true,
      },
      null,
      2
    ),
  })

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const buildPayload = () => {
    // headers
    const reqHeaders = kvToObject(formData.headers)
    const resHeaders = kvToObject(formData.responseHeaders)

    // bodySchema y responseBody desde los editores JSON
    const bodySchemaObj = safeParseJson(formData.bodySchema, undefined)
    const responseBodyObj = safeParseJson(formData.responseBody, {})

    // payload según el contrato acordado
    const payload: any = {
      request: {
        method: formData.method,
        urlPath: formData.urlPath,
        headers: reqHeaders,
      },
      response: {
        body: responseBodyObj,
        status_code: formData.responseStatus,
        success: true,
      },
      name: formData.name,
    }

    // delay opcional
    if (typeof formData.delay === "number" && formData.delay > 0) {
      payload.request.delay = formData.delay
    }

    // bodySchema opcional
    if (bodySchemaObj) {
      payload.request.bodySchema = bodySchemaObj
    }

    // headers de respuesta opcionales
    if (Object.keys(resHeaders).length > 0) {
      payload.response.headers = resHeaders
    }

    return payload
  }

  const handleSave = async () => {
    if (!formData.urlPath || !formData.method) {
      alert("Method y urlPath son requeridos.")
      return
    }
    setSaving(true)
    try {
      const payload = buildPayload()
      const res = await fetch("http://localhost:8000/v1/prototypes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const txt = await res.text().catch(() => "")
        throw new Error(`HTTP ${res.status}: ${txt || "failed"}`)
      }
      toast.success("Prototype guardado ✅")
    } catch (err: any) {
      toast.error(`Error al guardar: ${err?.message ?? String(err)}`)
    } finally {
      setSaving(false)
    }
  }

  const quickSnippets = [
    { name: "Random ID", value: "{{uuid}}" },
    { name: "Timestamp", value: "{{timestamp}}" },
    { name: "Random Name", value: "{{random.name}}" },
    { name: "Random Email", value: "{{random.email}}" },
    { name: "Random Number", value: "{{random.number}}" },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">New Prototype</h1>
                <p className="text-sm text-muted-foreground">Create a new API mock endpoint</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Draft"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="name">Prototype Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., User Authentication"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="method">HTTP Method</Label>
                  <Select value={formData.method} onValueChange={(value) => handleInputChange("method", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="PATCH">PATCH</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="urlPath">URL Path</Label>
                  <Input
                    id="urlPath"
                    placeholder="/v1/signin"
                    value={formData.urlPath}
                    onChange={(e) => handleInputChange("urlPath", e.target.value)}
                  />
                </div>
              </div>

              {/* Delay opcional */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="delay">Delay (ms)</Label>
                  <Input
                    id="delay"
                    type="number"
                    placeholder="0"
                    value={formData.delay}
                    onChange={(e) => handleInputChange("delay", Number(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="request">Request</TabsTrigger>
              <TabsTrigger value="response">Response</TabsTrigger>
              <TabsTrigger value="preview">Preview & Test</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            {/* Request Tab */}
            <TabsContent value="request" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Headers */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Request Headers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <KeyValueEditor
                      items={formData.headers}
                      onChange={(headers) => handleInputChange("headers", headers)}
                      keyPlaceholder="Header name"
                      valuePlaceholder="Header value"
                    />
                  </CardContent>
                </Card>

                {/* Query Parameters */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Query Parameters</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {formData.queryParams.map((param, index) => (
                        <div key={index} className="grid grid-cols-3 gap-2">
                          <Input
                            placeholder="Parameter name"
                            value={param.key}
                            onChange={(e) => {
                              const newParams = [...formData.queryParams]
                              newParams[index].key = e.target.value
                              handleInputChange("queryParams", newParams)
                            }}
                          />
                          <Input
                            placeholder="Default value"
                            value={param.value}
                            onChange={(e) => {
                              const newParams = [...formData.queryParams]
                              newParams[index].value = e.target.value
                              handleInputChange("queryParams", newParams)
                            }}
                          />
                          <div className="flex gap-1">
                            <Input
                              placeholder="Regex pattern"
                              value={param.regex}
                              onChange={(e) => {
                                const newParams = [...formData.queryParams]
                                newParams[index].regex = e.target.value
                                handleInputChange("queryParams", newParams)
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newParams = formData.queryParams.filter((_, i) => i !== index)
                                handleInputChange("queryParams", newParams)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleInputChange("queryParams", [
                            ...formData.queryParams,
                            { key: "", value: "", regex: "" },
                          ])
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Parameter
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Request Body Schema */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Request Body Schema</CardTitle>
                </CardHeader>
                <CardContent>
                  <JsonEditor
                    value={formData.bodySchema}
                    onChange={(value) => handleInputChange("bodySchema", value)}
                    placeholder='{"name":"SignupSchema","type_schema":"object","aditional_properties":false,"properties":[ ... ]}'
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Response Tab */}
            <TabsContent value="response" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Status Code */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Status Code</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select
                      value={formData.responseStatus.toString()}
                      onValueChange={(value) => handleInputChange("responseStatus", Number.parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="200">200 - OK</SelectItem>
                        <SelectItem value="201">201 - Created</SelectItem>
                        <SelectItem value="400">400 - Bad Request</SelectItem>
                        <SelectItem value="401">401 - Unauthorized</SelectItem>
                        <SelectItem value="404">404 - Not Found</SelectItem>
                        <SelectItem value="500">500 - Internal Server Error</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                {/* Response Headers */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Response Headers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <KeyValueEditor
                      items={formData.responseHeaders}
                      onChange={(headers) => handleInputChange("responseHeaders", headers)}
                      keyPlaceholder="Header name"
                      valuePlaceholder="Header value"
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Response Body */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Response Body</CardTitle>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">Quick snippets:</span>
                      {[
                        { name: "Random ID", value: "{{uuid}}" },
                        { name: "Timestamp", value: "{{timestamp}}" },
                        { name: "Random Name", value: "{{random.name}}" },
                        { name: "Random Email", value: "{{random.email}}" },
                        { name: "Random Number", value: "{{random.number}}" },
                      ].map((snippet) => (
                        <Button
                          key={snippet.name}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const currentBody = formData.responseBody || "{}"
                            // Inserta una clave extra al final (simple, no-ast)
                            const toAppend = `\n  "${snippet.name.toLowerCase().replace(" ", "_")}": "${snippet.value}",`
                            const newBody = currentBody.endsWith("\n}")
                              ? currentBody.replace(/\n\}$/, `${toAppend}\n}`)
                              : currentBody + toAppend
                            handleInputChange("responseBody", newBody)
                          }}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          {snippet.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <JsonEditor
                    value={formData.responseBody}
                    onChange={(value) => handleInputChange("responseBody", value)}
                    placeholder='{"data":{"jwt":"{{random.JWT}}","email":"{{body.email}}","image_profile":"{{random.URL}}"},"status_code":200,"success":true}'
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preview & Test Tab */}
            <TabsContent value="preview" className="space-y-6">
              <RequestPreview formData={formData} />
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Version History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="mb-4">
                      <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mx-auto">
                        <Eye className="h-6 w-6" />
                      </div>
                    </div>
                    <h3 className="text-lg font-medium mb-2">No version history yet</h3>
                    <p className="text-sm">Version history will appear here after you save your first prototype.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
