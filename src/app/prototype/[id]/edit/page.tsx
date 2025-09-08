"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Save, Eye } from "lucide-react"

import { KeyValueEditor } from "@/components/key-value-editor"
import { JsonEditor } from "@/components/json-editor"
import { RequestPreview } from "@/components/request-preview"

type KV = { key: string; value: string }

type ProtoAPI = {
  data: {
    id: string
    name: string
    createdAt: string
    updatedAt: string
    request: {
      method: string
      urlPath: string
      delay?: number
      headers?: Record<string, string> | null
      path_params?: Record<string, string> | null
      bodySchema?: {
        name: string
        type_schema: string
        aditional_properties: boolean
        properties: any[] | null
      } | null
    }
    response: {
      body: {
        data: unknown
        status_code: number
        success: boolean
      }
    }
  }
  status_code: number
  success: boolean
  trace_id: string
}

type FormData = {
  id?: string
  name: string
  method: string
  urlPath: string
  headers: KV[]
  pathParams: KV[]
  bodySchema: string
  responseStatus: number
  responseHeaders: KV[] // reservado para futuro si expones headers de respuesta
  responseBody: string
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"

function objToKV(obj?: Record<string, string> | null): KV[] {
  if (!obj) return []
  return Object.entries(obj).map(([key, value]) => ({ key, value }))
}

function kvToObj(kv: KV[]): Record<string, string> {
  const out: Record<string, string> = {}
  kv.forEach(({ key, value }) => {
    if (key) out[key] = value ?? ""
  })
  return out
}

export default function EditPrototype() {
  const params = useParams<{ id: string }>()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState("request")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [formData, setFormData] = useState<FormData>({
    name: "",
    method: "GET",
    urlPath: "",
    headers: [],
    pathParams: [],
    bodySchema: "{}",
    responseStatus: 200,
    responseHeaders: [],
    responseBody: "{}",
  })

  useEffect(() => {
    let active = true
    const load = async () => {
      if (!params?.id) return
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${API_BASE}/v1/prototypes/${params.id}`, { cache: "no-store" })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json: ProtoAPI = await res.json()
        const p = json.data

        const initial: FormData = {
          id: p.id,
          name: p.name || "",
          method: p.request.method || "GET",
          urlPath: p.request.urlPath || "",
          headers: objToKV(p.request.headers),
          pathParams: objToKV(p.request.path_params),
          bodySchema: JSON.stringify(p.request.bodySchema, null, 2),
          responseStatus: p.response.body.status_code ?? 200,
          responseHeaders: [],
          responseBody: JSON.stringify(p.response.body, null, 2),
        }

        if (active) setFormData(initial)
      } catch (e: any) {
        if (active) setError(e?.message ?? "Failed to load prototype")
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [params?.id])

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Helpers para vaciar headers
  const clearRequestHeaders = () => handleInputChange("headers", [])
  const clearResponseHeaders = () => handleInputChange("responseHeaders", [])
  const clearAllHeaders = () => {
    handleInputChange("headers", [])
    handleInputChange("responseHeaders", [])
  }

  // Construir payload con el formato que espera /v1/prototypes (status_code va *dentro* de response.body)
  const buildPayload = useMemo(() => {
    try {
      const bodySchemaParsed = JSON.parse(formData.bodySchema || "{}")
      const responseBodyParsed: any = JSON.parse(formData.responseBody || "{}")

      if (responseBodyParsed && typeof responseBodyParsed === "object" && responseBodyParsed.status_code == null) {
        responseBodyParsed.status_code = formData.responseStatus
      }

      const headersObj = kvToObj(formData.headers)
      const pathParamsObj = kvToObj(formData.pathParams)

      return {
        ...(formData.id ? { id: formData.id } : {}),
        name: formData.name,
        request: {
          method: formData.method,
          urlPath: formData.urlPath,
          bodySchema: bodySchemaParsed,
          ...(Object.keys(headersObj).length ? { headers: headersObj } : {}),
          ...(Object.keys(pathParamsObj).length ? { path_params: pathParamsObj } : {}),
        },
        response: {
          body: responseBodyParsed,
          // si luego soportas headers de respuesta, aplica el mismo patrón condicional aquí
        },
      }
    } catch {
      return null
    }
  }, [formData])

  const onSave = async () => {
    if (!buildPayload) return
    setSaveError(null)
    setSaving(true)
    try {
      const res = await fetch(`${API_BASE}/v1/prototypes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload),
      })
      if (!res.ok) {
        const txt = await res.text().catch(() => "")
        throw new Error(`HTTP ${res.status} ${txt}`)
      }
      const json = await res.json().catch(() => null as any)
      const newId = json?.data?.id || json?.id || formData.id
      if (newId) {
        router.push(`/prototype/${encodeURIComponent(newId)}`)
      }
    } catch (e: any) {
      setSaveError(e?.message ?? "Failed to save prototype")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center space-x-4">
              <Link href={`/prototype/${params.id}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Detail
                </Button>
              </Link>
              <h1 className="text-2xl font-bold">Loading…</h1>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-6 py-8">
          <div className="rounded-md border border-border p-6 text-sm text-muted-foreground">Fetching data…</div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center space-x-4">
              <Link href={`/prototype/${params.id}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Detail
                </Button>
              </Link>
              <h1 className="text-2xl font-bold">Error</h1>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-6 py-8">
          <div className="rounded-md border border-destructive/40 p-6 text-sm text-destructive">{error}</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href={`/prototype/${params.id}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Detail
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Edit Prototype</h1>
                <p className="text-sm text-muted-foreground">Modify your API mock endpoint</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" onClick={clearAllHeaders}>
                Borrar todos los Headers
              </Button>
              <Link href={`/prototype/${params.id}`}>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </Link>
              <Button size="sm" disabled={!buildPayload || saving} onClick={onSave}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {saveError && (
            <div className="rounded-md border border-destructive/40 p-4 text-sm text-destructive">{saveError}</div>
          )}

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Prototype Name</Label>
                  <Input id="name" value={formData.name} onChange={(e) => handleInputChange("name", e.target.value)} />
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
                    value={formData.urlPath}
                    onChange={(e) => handleInputChange("urlPath", e.target.value)}
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
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Request Headers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <KeyValueEditor
                      items={formData.headers}
                      onChange={(headers) => handleInputChange("headers", headers)}
                      keyPlaceholder="Header name"
                      valuePlaceholder="Header value"
                      allowDeleteLast={true}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Path Parameters</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <KeyValueEditor
                      items={formData.pathParams}
                      onChange={(pathParams) => handleInputChange("pathParams", pathParams)}
                      keyPlaceholder="Parameter name"
                      valuePlaceholder="Default value"
                      allowDeleteLast={true}
                    />
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Request Body Schema</CardTitle>
                </CardHeader>
                <CardContent>
                  <JsonEditor
                    value={formData.bodySchema}
                    onChange={(value) => handleInputChange("bodySchema", value)}
                    placeholder='{"name":"","type_schema":"","aditional_properties":false,"properties":null}'
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Response Tab */}
            <TabsContent value="response" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

                <Card className="lg:col-span-2">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Response Headers</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive"
                      onClick={clearResponseHeaders}
                    >
                      Vaciar
                    </Button>
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

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Response Body</CardTitle>
                </CardHeader>
                <CardContent>
                  <JsonEditor
                    value={formData.responseBody}
                    onChange={(value) => handleInputChange("responseBody", value)}
                    placeholder='{"data":{...},"status_code":200,"success":true}'
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
                    <h3 className="text-lg font-medium mb-2">Version history coming soon</h3>
                    <p className="text-sm">Track changes and compare versions of your prototypes.</p>
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
