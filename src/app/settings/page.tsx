"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Save, Download, Upload, Moon, Sun, Globe, Database, FileText, Trash2 } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function Settings() {
  const { toast } = useToast()
  const [settings, setSettings] = useState({
    baseUrl: "https://api.mocky-prototypes.dev",
    theme: "dark",
    autoSave: true,
    enableAnalytics: false,
    defaultResponseDelay: 0,
    maxPrototypes: 100,
  })

  const handleSettingChange = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleSaveSettings = () => {
    // Simulate saving settings
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated successfully.",
    })
  }

  const handleExportPrototypes = () => {
    // Mock export data
    const exportData = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      prototypes: [
        {
          id: 1,
          name: "User Authentication",
          method: "POST",
          urlPath: "/api/auth/login",
          status: "published",
        },
        // Add more mock data as needed
      ],
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `mocky-prototypes-${new Date().toISOString().split("T")[0]}.json`
    link.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Export completed",
      description: "Your prototypes have been exported successfully.",
    })
  }

  const handleImportPrototypes = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string)
        console.log("Imported data:", importData)
        toast({
          title: "Import completed",
          description: `Successfully imported ${importData.prototypes?.length || 0} prototypes.`,
        })
      } catch (error) {
        toast({
          title: "Import failed",
          description: "Invalid JSON file format.",
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)
  }

  const handleClearAllData = () => {
    if (confirm("Are you sure you want to clear all prototypes? This action cannot be undone.")) {
      toast({
        title: "Data cleared",
        description: "All prototypes have been removed.",
        variant: "destructive",
      })
    }
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
                <h1 className="text-2xl font-bold text-foreground">Settings</h1>
                <p className="text-sm text-muted-foreground">Configure your Mocky Prototypes environment</p>
              </div>
            </div>
            <Button onClick={handleSaveSettings}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Environment Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <CardTitle>Environment Configuration</CardTitle>
              </div>
              <CardDescription>Configure your API environment and base URLs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="baseUrl">Base URL</Label>
                  <Input
                    id="baseUrl"
                    value={settings.baseUrl}
                    onChange={(e) => handleSettingChange("baseUrl", e.target.value)}
                    placeholder="https://api.example.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    The base URL for your mock API endpoints. All prototypes will be accessible under this domain.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="responseDelay">Default Response Delay (ms)</Label>
                  <Input
                    id="responseDelay"
                    type="number"
                    value={settings.defaultResponseDelay}
                    onChange={(e) => handleSettingChange("defaultResponseDelay", Number.parseInt(e.target.value))}
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground">
                    Add artificial delay to simulate real API response times.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Moon className="h-5 w-5" />
                <CardTitle>Appearance</CardTitle>
              </div>
              <CardDescription>Customize the look and feel of your workspace</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Theme</Label>
                  <p className="text-sm text-muted-foreground">Choose your preferred color scheme</p>
                </div>
                <Select value={settings.theme} onValueChange={(value) => handleSettingChange("theme", value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">
                      <div className="flex items-center space-x-2">
                        <Moon className="h-4 w-4" />
                        <span>Dark</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="light">
                      <div className="flex items-center space-x-2">
                        <Sun className="h-4 w-4" />
                        <span>Light</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <CardTitle>Preferences</CardTitle>
              </div>
              <CardDescription>Configure your workflow and productivity settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Auto-save</Label>
                  <p className="text-sm text-muted-foreground">Automatically save changes as you type</p>
                </div>
                <Switch
                  checked={settings.autoSave}
                  onCheckedChange={(checked) => handleSettingChange("autoSave", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Enable Analytics</Label>
                  <p className="text-sm text-muted-foreground">Help improve Mocky Prototypes with usage analytics</p>
                </div>
                <Switch
                  checked={settings.enableAnalytics}
                  onCheckedChange={(checked) => handleSettingChange("enableAnalytics", checked)}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="maxPrototypes">Maximum Prototypes</Label>
                <Input
                  id="maxPrototypes"
                  type="number"
                  value={settings.maxPrototypes}
                  onChange={(e) => handleSettingChange("maxPrototypes", Number.parseInt(e.target.value))}
                  className="w-32"
                />
                <p className="text-xs text-muted-foreground">
                  Limit the number of prototypes you can create (0 = unlimited)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <CardTitle>Data Management</CardTitle>
              </div>
              <CardDescription>Import, export, and manage your prototype data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={handleExportPrototypes} variant="outline" className="h-20 flex-col bg-transparent">
                  <Download className="h-6 w-6 mb-2" />
                  <span className="font-medium">Export Prototypes</span>
                  <span className="text-xs text-muted-foreground">Download as JSON</span>
                </Button>

                <div>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportPrototypes}
                    className="hidden"
                    id="import-file"
                  />
                  <Button asChild variant="outline" className="h-20 flex-col w-full bg-transparent">
                    <label htmlFor="import-file" className="cursor-pointer">
                      <Upload className="h-6 w-6 mb-2" />
                      <span className="font-medium">Import Prototypes</span>
                      <span className="text-xs text-muted-foreground">Upload JSON file</span>
                    </label>
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-destructive mb-2">Danger Zone</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    These actions are irreversible. Please proceed with caution.
                  </p>
                </div>
                <Button onClick={handleClearAllData} variant="destructive" className="w-full">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Prototypes
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* API Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>Advanced settings for API behavior and responses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="corsOrigins">CORS Origins</Label>
                <Textarea
                  id="corsOrigins"
                  placeholder="https://localhost:3000&#10;https://myapp.com&#10;https://*.example.com"
                  rows={4}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  One origin per line. Use * for wildcards. Leave empty to allow all origins.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customHeaders">Global Response Headers</Label>
                <Textarea
                  id="customHeaders"
                  placeholder="X-API-Version: 1.0&#10;X-Rate-Limit: 1000"
                  rows={3}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Headers to include in all responses. Format: Header-Name: value (one per line).
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
