"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Send, Copy, Check } from "lucide-react"

interface RequestPreviewProps {
  formData: {
    name: string
    method: string
    urlPath: string
    headers: Array<{ key: string; value: string }>
    queryParams: Array<{ key: string; value: string; regex: string }>
    bodySchema: string
    responseStatus: number
    responseHeaders: Array<{ key: string; value: string }>
    responseBody: string
  }
}

export function RequestPreview({ formData }: RequestPreviewProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<any>(null)
  const [copied, setCopied] = useState(false)

  const mockUrl = `/v1/mocky${formData.urlPath}`

  const handleSendRequest = async () => {
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      try {
        const mockResponse = {
          status: formData.responseStatus,
          headers: Object.fromEntries(
            formData.responseHeaders.filter((h) => h.key && h.value).map((h) => [h.key, h.value]),
          ),
          body: JSON.parse(
            formData.responseBody.replace(/\{\{(\w+\.?\w*)\}\}/g, (match, key) => {
              switch (key) {
                case "timestamp":
                  return new Date().toISOString()
                case "uuid":
                  return crypto.randomUUID()
                case "random.name":
                  return "John Doe"
                case "random.email":
                  return "john@example.com"
                case "random.number":
                  return Math.floor(Math.random() * 1000).toString()
                default:
                  return match
              }
            }),
          ),
        }
        setResponse(mockResponse)
      } catch (e) {
        setResponse({
          status: 500,
          headers: { "Content-Type": "application/json" },
          body: { error: "Invalid response body JSON" },
        })
      }
      setIsLoading(false)
    }, 1000)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Request Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Request</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono">
              {formData.method}
            </Badge>
            <code className="text-sm bg-muted px-2 py-1 rounded flex-1">{mockUrl}</code>
            <Button size="sm" variant="ghost" onClick={() => copyToClipboard(mockUrl)}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          {formData.headers.some((h) => h.key && h.value) && (
            <div>
              <h4 className="text-sm font-medium mb-2">Headers</h4>
              <div className="space-y-1">
                {formData.headers
                  .filter((h) => h.key && h.value)
                  .map((header, index) => (
                    <div key={index} className="text-sm font-mono bg-muted p-2 rounded">
                      <span className="text-muted-foreground">{header.key}:</span> {header.value}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {formData.bodySchema && formData.bodySchema !== "{}" && (
            <div>
              <h4 className="text-sm font-medium mb-2">Request Body</h4>
              <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                {JSON.stringify(JSON.parse(formData.bodySchema), null, 2)}
              </pre>
            </div>
          )}

          <Button onClick={handleSendRequest} disabled={isLoading || !formData.urlPath} className="w-full">
            <Send className="h-4 w-4 mr-2" />
            {isLoading ? "Sending..." : "Send Request"}
          </Button>
        </CardContent>
      </Card>

      {/* Response Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Response</CardTitle>
        </CardHeader>
        <CardContent>
          {!response ? (
            <div className="text-center py-12 text-muted-foreground">
              <Send className="h-8 w-8 mx-auto mb-4 opacity-50" />
              <p>Click "Send Request" to see the response</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant={response.status < 400 ? "default" : "destructive"} className="font-mono">
                  {response.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {response.status < 300
                    ? "Success"
                    : response.status < 400
                      ? "Redirect"
                      : response.status < 500
                        ? "Client Error"
                        : "Server Error"}
                </span>
              </div>

              {Object.keys(response.headers).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Response Headers</h4>
                  <div className="space-y-1">
                    {Object.entries(response.headers).map(([key, value]) => (
                      <div key={key} className="text-sm font-mono bg-muted p-2 rounded">
                        <span className="text-muted-foreground">{key}:</span> {value as string}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium mb-2">Response Body</h4>
                <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-64">
                  {JSON.stringify(response.body, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
