// src/app/api/proxy/[service]/[...path]/route.ts
import { NextRequest } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const TARGETS: Record<string, string> = {
  // pon también estas envs en Vercel (Production/Preview)
  mocky: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8010",
  chat: process.env.NEXT_PUBLIC_CHAT_API_BASE_URL ?? "http://localhost:8011",
}

function fwdHeaders(h: Headers) {
  const out = new Headers()
  for (const [k, v] of h.entries()) {
    const kk = k.toLowerCase()
    if (["host", "connection", "content-length"].includes(kk)) continue
    out.set(k, v)
  }
  return out
}

async function proxy(req: NextRequest, method: string, params: { service?: string, path?: string[] }) {
  const service = params.service ?? ""
  const base = TARGETS[service]
  if (!base) return new Response(`Unknown service: ${service}`, { status: 400 })

  const joined = (params.path ?? []).join("/")
  const src = new URL(req.url)
  const target = `${base}/${joined}${src.search}`

  const init: RequestInit = {
    method,
    headers: fwdHeaders(req.headers),
    redirect: "manual",
    cache: "no-store",
  }
  if (method !== "GET" && method !== "HEAD") init.body = await req.arrayBuffer()

  const res = await fetch(target, init)
  const headers = new Headers(res.headers)
  headers.delete("content-encoding")
  headers.delete("transfer-encoding")
  return new Response(res.body, { status: res.status, headers })
}

export const GET     = (r: NextRequest, c: any) => proxy(r, "GET", c.params)
export const POST    = (r: NextRequest, c: any) => proxy(r, "POST", c.params)
export const PUT     = (r: NextRequest, c: any) => proxy(r, "PUT", c.params)
export const PATCH   = (r: NextRequest, c: any) => proxy(r, "PATCH", c.params)
export const DELETE  = (r: NextRequest, c: any) => proxy(r, "DELETE", c.params)
export const OPTIONS = (r: NextRequest, c: any) => proxy(r, "OPTIONS", c.params)
