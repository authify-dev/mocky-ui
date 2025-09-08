"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Play, Copy, Check } from "lucide-react"
import { Input } from "@/components/ui/input"

type ProtoResponse = {
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

const methodColors: Record<string, string> = {
  GET: "bg-green-500/20 text-green-400 border-green-500/30",
  POST: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  PUT: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  PATCH: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  DELETE: "bg-red-500/20 text-red-400 border-red-500/30",
}

export default function PrototypeDetail() {
  const params = useParams<{ id: string }>()
  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : ""
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [proto, setProto] = useState<ProtoResponse["data"] | null>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      if (!id) return
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/proxy/mocky/v1/prototypes/${encodeURIComponent(id)}`, { cache: "no-store" })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json: ProtoResponse = await res.json()
        if (active) setProto(json.data)
      } catch (e: any) {
        if (active) setError(e?.message ?? "Failed to fetch")
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [id])

  const mockUrl = useMemo(() => {
    if (!proto) return ""
    // Ruta real del servidor de mocky
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8010"
    return `${API_BASE}/v1/mocky${proto.request.urlPath}`
  }, [proto])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
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
                <h1 className="text-2xl font-bold">Loading…</h1>
              </div>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-6 py-8">
          <div className="rounded-md border border-border p-6 text-sm text-muted-foreground">
            Fetching prototype…
          </div>
        </main>
      </div>
    )
  }

  if (error || !proto) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl font-bold">Error</h1>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-6 py-8">
          <div className="rounded-md border border-destructive/40 p-6 text-sm text-destructive">
            {error ?? "Prototype not found"}
          </div>
        </main>
      </div>
    )
  }

  const method = proto.request.method
  const createdAt = proto.createdAt
  const updatedAt = proto.updatedAt
  const reqHeaders = Object.entries(proto.request.headers ?? {})
  const pathParams = Object.entries(proto.request.path_params ?? {})
  const bodySchema = proto.request.bodySchema ?? {
    name: "",
    type_schema: "",
    aditional_properties: false,
    properties: null,
  }
  const responseStatus = proto.response.body.status_code
  const responseBody = proto.response.body

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
                <div className="flex items-center space-x-3">
                  <h1 className="text-2xl font-bold text-foreground">{proto.name || "Untitled"}</h1>
                  <Badge variant="outline" className={`font-mono text-xs ${methodColors[method] ?? ""}`}>
                    {method}
                  </Badge>
                  <Badge variant="default">published</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1"></p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Play className="h-4 w-4 mr-2" />
                Try it
              </Button>
              <Link href={`/prototype/${id}/edit`}>
                <Button size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Endpoint URL</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      readOnly
                      value={mockUrl}
                      onFocus={(e) => e.currentTarget.select()}
                      className="font-mono text-sm"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="shrink-0"
                      onClick={() => copyToClipboard(mockUrl)}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>

                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                  <div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Created</label>
                      <p className="text-sm mt-1">{new Date(createdAt).toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                      <p className="text-sm mt-1">{new Date(updatedAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="mt-1">
                      <Badge variant="default">published</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Request Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Request Details
                  <Badge variant="outline" className="font-mono text-xs">
                    {method}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {(reqHeaders?.length ?? 0) > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3">Headers</h4>
                    <div className="space-y-2">
                      {reqHeaders.map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <span className="font-mono text-sm text-muted-foreground">{k}</span>
                          <span className="font-mono text-sm">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(pathParams?.length ?? 0) > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3">Path Parameters</h4>
                    <div className="space-y-2">
                      {pathParams.map(([k, v]) => (
                        <div key={k} className="p-3 bg-muted rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-sm font-medium">{k}</span>
                            <span className="font-mono text-sm text-muted-foreground">{v}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium mb-3">Request Body Schema</h4>
                  <div className="bg-muted rounded-lg p-4">
                    <pre className="text-xs font-mono overflow-auto">
                      {JSON.stringify(
                        proto.request.bodySchema ?? {
                          name: "",
                          type_schema: "",
                          aditional_properties: false,
                          properties: null,
                        },
                        null,
                        2
                      )}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Response Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Response Details
                  <Badge variant="outline" className="font-mono text-xs">
                    {responseStatus}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium mb-3">Response Body</h4>
                  <div className="bg-muted rounded-lg p-4">
                    <pre className="text-xs font-mono overflow-auto">
                      {JSON.stringify(responseBody, null, 2)}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
