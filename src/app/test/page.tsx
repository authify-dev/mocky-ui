"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Send, Copy, Check, Clock, Save, Play } from "lucide-react"
import Link from "next/link"
import { KeyValueEditor } from "@/components/key-value-editor"

// Mock prototypes data
const mockPrototypes = [
  {
    id: 1,
    name: "User Authentication",
    method: "POST",
    urlPath: "/api/auth/login",
    status: "published",
  },
  {
    id: 2,
    name: "Get User Profile",
    method: "GET",
    urlPath: "/api/users/:id",
    status: "published",
  },
  {
    id: 3,
    name: "Create Product",
    method: "POST",
    urlPath: "/api/products",
    status: "published",
  },
]

// Mock test history
const mockTestHistory = [
  {
    id: 1,
    prototypeId: 1,
    method: "POST",
    url: "/v1/mocky/api/auth/login",
    status: 200,
    responseTime: 245,
    timestamp: "2024-01-15 14:30:25",
  },
  {
    id: 2,
    prototypeId: 2,
    method: "GET",
    url: "/v1/mocky/api/users/123",
    status: 200,
    responseTime: 156,
    timestamp: "2024-01-15 14:28:12",
  },
  {
    id: 3,
    prototypeId: 1,
    method: "POST",
    url: "/v1/mocky/api/auth/login",
    status: 401,
    responseTime: 89,
    timestamp: "2024-01-15 14:25:45",
  },
]

const methodColors = {
  GET: "bg-green-500/20 text-green-400 border-green-500/30",
  POST: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  PUT: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  PATCH: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  DELETE: "bg-red-500/20 text-red-400 border-red-500/30",
}

export default function TestInterface() {
  const [selectedPrototype, setSelectedPrototype] = useState<number | null>(null)
  const [customUrl, setCustomUrl] = useState("")
  const [customMethod, setCustomMethod] = useState("GET")
  const [headers, setHeaders] = useState([{ key: "Content-Type", value: "application/json" }])
  const [requestBody, setRequestBody] = useState("")
  const [response, setResponse] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState("request")

  const selectedPrototypeData = mockPrototypes.find((p) => p.id === selectedPrototype)

  const handlePrototypeSelect = (prototypeId: string) => {
    const id = Number.parseInt(prototypeId)
    setSelectedPrototype(id)
    const prototype = mockPrototypes.find((p) => p.id === id)
    if (prototype) {
      setCustomUrl(`/v1/mocky${prototype.urlPath}`)
      setCustomMethod(prototype.method)
    }
  }

  const handleSendRequest = async () => {
    setIsLoading(true)

    // Simulate API call
    setTimeout(
      () => {
        const mockResponse = {
          status: Math.random() > 0.2 ? 200 : 400,
          statusText: Math.random() > 0.2 ? "OK" : "Bad Request",
          headers: {
            "Content-Type": "application/json",
            "X-Response-Time": "156ms",
            "X-Request-ID": crypto.randomUUID(),
          },
          body:
            Math.random() > 0.2
              ? {
                  success: true,
                  message: "Request successful",
                  data: {
                    id: crypto.randomUUID(),
                    timestamp: new Date().toISOString(),
                    user: "john@example.com",
                  },
                }
              : {
                  error: "Bad Request",
                  message: "Invalid request parameters",
                  code: 400,
                },
          responseTime: Math.floor(Math.random() * 500) + 50,
        }
        setResponse(mockResponse)
        setIsLoading(false)
      },
      Math.floor(Math.random() * 1000) + 500,
    )
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const generateCurlCommand = () => {
    let curl = `curl -X ${customMethod} "${customUrl}"`

    headers.forEach((header) => {
      if (header.key && header.value) {
        curl += ` \\\n  -H "${header.key}: ${header.value}"`
      }
    })

    if (requestBody && (customMethod === "POST" || customMethod === "PUT" || customMethod === "PATCH")) {
      curl += ` \\\n  -d '${requestBody}'`
    }

    return curl
  }

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
                <h1 className="text-2xl font-bold text-foreground">API Tester</h1>
                <p className="text-sm text-muted-foreground">Test your mock endpoints and validate responses</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Save className="h-4 w-4 mr-2" />
                Save Test Case
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Request Configuration */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="request">Request</TabsTrigger>
                <TabsTrigger value="response">Response</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              {/* Request Tab */}
              <TabsContent value="request" className="space-y-6">
                {/* Prototype Selector */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Select Prototype</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select value={selectedPrototype?.toString() || ""} onValueChange={handlePrototypeSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a prototype to test" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockPrototypes.map((prototype) => (
                          <SelectItem key={prototype.id} value={prototype.id.toString()}>
                            <div className="flex items-center space-x-2">
                              <Badge
                                variant="outline"
                                className={`text-xs ${methodColors[prototype.method as keyof typeof methodColors]}`}
                              >
                                {prototype.method}
                              </Badge>
                              <span>{prototype.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                {/* Request Configuration */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Request Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Select value={customMethod} onValueChange={setCustomMethod}>
                        <SelectTrigger className="w-32">
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
                      <Input
                        placeholder="Enter URL or select a prototype"
                        value={customUrl}
                        onChange={(e) => setCustomUrl(e.target.value)}
                        className="flex-1 font-mono"
                      />
                      <Button onClick={handleSendRequest} disabled={isLoading || !customUrl}>
                        <Send className="h-4 w-4 mr-2" />
                        {isLoading ? "Sending..." : "Send"}
                      </Button>
                    </div>

                    {/* Headers */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Headers</Label>
                      <KeyValueEditor
                        items={headers}
                        onChange={setHeaders}
                        keyPlaceholder="Header name"
                        valuePlaceholder="Header value"
                      />
                    </div>

                    {/* Request Body */}
                    {(customMethod === "POST" || customMethod === "PUT" || customMethod === "PATCH") && (
                      <div>
                        <Label className="text-sm font-medium mb-3 block">Request Body</Label>
                        <Textarea
                          placeholder="Enter JSON request body..."
                          value={requestBody}
                          onChange={(e) => setRequestBody(e.target.value)}
                          className="font-mono text-sm min-h-32"
                          rows={6}
                        />
                      </div>
                    )}

                    {/* cURL Command */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium">cURL Command</Label>
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(generateCurlCommand())}>
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      <div className="bg-muted rounded-lg p-3">
                        <pre className="text-xs font-mono overflow-auto whitespace-pre-wrap">
                          {generateCurlCommand()}
                        </pre>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Response Tab */}
              <TabsContent value="response" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Response</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!response ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Send className="h-8 w-8 mx-auto mb-4 opacity-50" />
                        <p>Send a request to see the response</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Status and Timing */}
                        <div className="flex items-center gap-4">
                          <Badge variant={response.status < 400 ? "default" : "destructive"} className="font-mono">
                            {response.status} {response.statusText}
                          </Badge>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {response.responseTime}ms
                          </div>
                        </div>

                        {/* Response Headers */}
                        <div>
                          <h4 className="text-sm font-medium mb-2">Response Headers</h4>
                          <div className="space-y-1">
                            {Object.entries(response.headers).map(([key, value]) => (
                              <div
                                key={key}
                                className="flex items-center justify-between p-2 bg-muted rounded text-sm font-mono"
                              >
                                <span className="text-muted-foreground">{key}:</span>
                                <span>{value as string}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Response Body */}
                        <div>
                          <h4 className="text-sm font-medium mb-2">Response Body</h4>
                          <div className="bg-muted rounded-lg p-4">
                            <pre className="text-xs font-mono overflow-auto">
                              {JSON.stringify(response.body, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Test History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {mockTestHistory.map((test) => (
                        <div
                          key={test.id}
                          className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50"
                        >
                          <div className="flex items-center space-x-3">
                            <Badge
                              variant="outline"
                              className={`text-xs ${methodColors[test.method as keyof typeof methodColors]}`}
                            >
                              {test.method}
                            </Badge>
                            <span className="font-mono text-sm">{test.url}</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Badge variant={test.status < 400 ? "default" : "destructive"}>{test.status}</Badge>
                            <span className="text-sm text-muted-foreground">{test.responseTime}ms</span>
                            <span className="text-xs text-muted-foreground">{test.timestamp}</span>
                            <Button size="sm" variant="ghost">
                              <Play className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Panel - Quick Actions & Stats */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Test Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Tests</span>
                  <span className="font-bold">{mockTestHistory.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Success Rate</span>
                  <span className="font-bold text-green-400">
                    {Math.round((mockTestHistory.filter((t) => t.status < 400).length / mockTestHistory.length) * 100)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg Response Time</span>
                  <span className="font-bold">
                    {Math.round(mockTestHistory.reduce((acc, t) => acc + t.responseTime, 0) / mockTestHistory.length)}ms
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Available Prototypes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Available Prototypes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {mockPrototypes.map((prototype) => (
                    <div
                      key={prototype.id}
                      className={`p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 ${
                        selectedPrototype === prototype.id ? "bg-muted border-primary" : ""
                      }`}
                      onClick={() => handlePrototypeSelect(prototype.id.toString())}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant="outline"
                            className={`text-xs ${methodColors[prototype.method as keyof typeof methodColors]}`}
                          >
                            {prototype.method}
                          </Badge>
                          <span className="text-sm font-medium">{prototype.name}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {prototype.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono mt-1">{prototype.urlPath}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Saved Test Cases */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Saved Test Cases</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Save className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No saved test cases yet</p>
                  <p className="text-xs">Save frequently used requests for quick access</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
