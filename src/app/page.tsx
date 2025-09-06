"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Plus, Search, Filter, MoreHorizontal, Eye, Edit, Copy, Trash2, Settings, TestTube,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

type ApiPrototype = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  request: {
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | string
    urlPath: string
  }
}

type ApiResponse = {
  results: ApiPrototype[]
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

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"

export default function Dashboard() {
  const router = useRouter()

  const [searchTerm, setSearchTerm] = useState("")
  const [methodFilter, setMethodFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all") // por ahora no viene del BE
  const [data, setData] = useState<ApiPrototype[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${API_BASE}/v1/prototypes`, { cache: "no-store" })
        if (!res.ok) {
          const txt = await res.text().catch(() => "")
          throw new Error(`HTTP ${res.status} ${txt}`)
        }
        const json: ApiResponse = await res.json()
        if (active) setData(json.results || [])
      } catch (e: any) {
        if (active) setError(e?.message ?? "Failed to fetch")
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const derived = useMemo(() => {
    // hasta que tengas estado real, asumimos "published"
    const withStatus = data.map((p) => ({
      ...p,
      status: "published" as "published" | "draft",
    }))

    const filtered = withStatus.filter((p) => {
      const matchesSearch =
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.request.urlPath.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesMethod = methodFilter === "all" || p.request.method === methodFilter
      const matchesStatus = statusFilter === "all" || p.status === statusFilter
      return matchesSearch && matchesMethod && matchesStatus
    })

    const stats = {
      total: withStatus.length,
      published: withStatus.filter((p) => p.status === "published").length,
      drafts: withStatus.filter((p) => p.status === "draft").length,
      thisWeek: filtered.length, // placeholder; ajusta si agregas lógica por fechas
    }

    return { filtered, stats }
  }, [data, methodFilter, searchTerm, statusFilter])

  const goToDetail = (id: string) => router.push(`/prototype/${id}`)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-foreground">Mocky</h1>
              <Badge variant="secondary" className="text-xs">
                Developer Tools
              </Badge>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/test">
                <Button variant="outline" size="sm">
                  <TestTube className="h-4 w-4 mr-2" />
                  API Tester
                </Button>
              </Link>
              <Link href="/settings">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </Link>
              <Link href="/prototype/new">
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Prototype
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle>API Prototypes</CardTitle>
              <CardDescription>Manage your mock endpoints and test API responses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or URL path..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={methodFilter} onValueChange={setMethodFilter}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* States */}
              {loading && (
                <div className="rounded-md border border-border p-6 text-sm text-muted-foreground">
                  Loading prototypes…
                </div>
              )}
              {error && !loading && (
                <div className="rounded-md border border-destructive/40 p-6 text-sm text-destructive">
                  Failed to load: {error}
                </div>
              )}

              {/* Prototypes Table */}
              {!loading && !error && (
                <div className="rounded-md border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>URL Path</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {derived.filtered.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No prototypes found. Create your first mock endpoint to get started.
                          </TableCell>
                        </TableRow>
                      ) : (
                        derived.filtered.map((p) => (
                          <TableRow
                            key={p.id}
                            className="hover:bg-muted/50 cursor-pointer"
                            role="button"
                            tabIndex={0}
                            onClick={() => goToDetail(p.id)}
                            onKeyDown={(e) => { if (e.key === "Enter") goToDetail(p.id) }}
                          >
                            <TableCell className="font-medium">{p.name || "Untitled"}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`font-mono text-xs ${methodColors[p.request.method] ?? ""}`}
                              >
                                {p.request.method}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-sm text-muted-foreground">
                              {p.request.urlPath}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(p.updatedAt).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant={"default"} className="capitalize">
                                {"published"}
                              </Badge>
                            </TableCell>
                            <TableCell
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.stopPropagation()}
                            >
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                  <DropdownMenuItem onClick={() => goToDetail(p.id)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => goToDetail(`${p.id}/edit`)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Duplicate
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Prototypes</p>
                    <p className="text-2xl font-bold">{derived.stats.total}</p>
                  </div>
                  <div className="h-8 w-8 bg-primary/20 rounded-full flex items-center justify-center">
                    <Plus className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Published</p>
                    <p className="text-2xl font-bold">{derived.stats.published}</p>
                  </div>
                  <div className="h-8 w-8 bg-green-500/20 rounded-full flex items-center justify-center">
                    <Eye className="h-4 w-4 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Drafts</p>
                    <p className="text-2xl font-bold">{derived.stats.drafts}</p>
                  </div>
                  <div className="h-8 w-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
                    <Edit className="h-4 w-4 text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">This Week</p>
                    <p className="text-2xl font-bold">{derived.stats.thisWeek}</p>
                  </div>
                  <div className="h-8 w-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <Filter className="h-4 w-4 text-blue-400" />
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
