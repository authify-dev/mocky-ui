"use client"

import React, { useEffect, useRef, useState } from "react"

type Message = { role: "user" | "assistant"; text: string }

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const listRef = useRef<HTMLDivElement>(null)

  // Autoscroll cuando cambian los mensajes
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, open])

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return
    setInput("")
    setMessages((prev) => [...prev, { role: "user", text }])
    setLoading(true)
    try {

      const res = await fetch(`/api/proxy/chat/message/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) {
        const t = await res.text().catch(() => "")
        throw new Error(`HTTP ${res.status} ${t}`)
      }
      const json = await res.json()
      const reply = (json?.response ?? "").toString()
      setMessages((prev) => [...prev, { role: "assistant", text: reply || "…" }])
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: `⚠️ Error al enviar mensaje: ${err?.message || err}` },
      ])
    } finally {
      setLoading(false)
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
    if (e.key === "Escape") setOpen(false)
  }

  return (
    <>
      {/* Botón flotante */}
      <button
        type="button"
        aria-label={open ? "Cerrar chat" : "Abrir chat"}
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-4 right-4 z-50 rounded-full shadow-lg border border-white/10 bg-white/90 dark:bg-zinc-900/90 backdrop-blur px-4 py-3 hover:shadow-xl transition"
      >
        <div className="flex items-center gap-2">
          {/* Icono de chat */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M21 12c0 3.866-3.806 7-8.5 7a9.7 9.7 0 0 1-2.53-.33L4 20l1.53-3.06A7.9 7.9 0 0 1 3.5 12C3.5 8.134 7.306 5 12 5s9 3.134 9 7Z" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <span className="text-sm font-medium">{open ? "Cerrar" : "Chat"}</span>
        </div>
      </button>

      {/* Panel del chat */}
      <div
        className={`fixed bottom-20 right-4 z-50 w-[22rem] sm:w-[24rem] max-h-[70vh] rounded-2xl border border-white/10 bg-white/95 dark:bg-zinc-900/95 backdrop-blur shadow-xl transition-all ${
          open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-3 pointer-events-none"
        }`}
        role="dialog"
        aria-modal="true"
      >
        <div className="p-3 border-b border-white/10 flex items-center justify-between">
          <div className="text-sm font-semibold">Asistente</div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-md p-1 hover:bg-black/5 dark:hover:bg-white/5"
            aria-label="Cerrar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div ref={listRef} className="px-3 py-2 overflow-y-auto max-h-[50vh] space-y-2">
          {messages.length === 0 && (
            <div className="text-xs text-zinc-500 py-6 text-center">
              Escribe un mensaje para iniciar la conversación.
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`px-3 py-2 rounded-xl text-sm whitespace-pre-wrap break-words max-w-[85%] ${
                  m.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="px-3 py-2 rounded-xl text-sm bg-zinc-100 dark:bg-zinc-800">
                Pensando…
              </div>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-2">
            <input
              className="flex-1 rounded-xl px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-white/10 outline-none focus:ring-2 focus:ring-blue-500/40"
              placeholder="Escribe un mensaje y presiona Enter"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="rounded-xl px-3 py-2 text-sm font-medium bg-blue-600 text-white disabled:opacity-50"
            >
              Enviar
            </button>
          </div>
          <div className="mt-1 text-[10px] text-zinc-500">
            Enter para enviar • Esc para cerrar
          </div>
        </div>
      </div>
    </>
  )
}
