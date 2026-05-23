import { useEffect, useRef, useState } from 'react'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { useAppStore } from '../../../store/useAppStore'
import { api } from '../../../lib/axios'

const WS_BASE = (import.meta.env.VITE_WS_URL as string | undefined) ?? 'ws://localhost:8080'
const SAVE_INTERVAL_MS = 30_000 // save every 30 seconds

interface UseYjsProviderResult {
  doc: Y.Doc | null
  provider: WebsocketProvider | null
  isConnected: boolean
  isSynced: boolean
}

/** Load persisted Yjs state from the server and apply it to the doc. */
async function loadState(docId: string, ydoc: Y.Doc): Promise<void> {
  try {
    const res = await api.get(`/api/documents/${docId}/state`, {
      responseType: 'arraybuffer',
    })
    if (res.status === 200 && res.data && res.data.byteLength > 0) {
      Y.applyUpdate(ydoc, new Uint8Array(res.data))
      console.log('[Yjs] Loaded persisted state:', res.data.byteLength, 'bytes')
    }
  } catch (err: any) {
    // 204 No Content means no saved state yet — that's fine.
    if (err.response?.status !== 204) {
      console.warn('[Yjs] Failed to load state:', err)
    }
  }
}

/** Save the full Yjs doc state to the server. */
async function saveState(docId: string, ydoc: Y.Doc): Promise<void> {
  try {
    const state = Y.encodeStateAsUpdate(ydoc)
    await api.put(`/api/documents/${docId}/state`, state, {
      headers: { 'Content-Type': 'application/octet-stream' },
    })
  } catch (err) {
    console.warn('[Yjs] Failed to save state:', err)
  }
}

export function useYjsProvider(docId: string): UseYjsProviderResult {
  const token = useAppStore((s) => s.token)
  const docRef = useRef<Y.Doc | null>(null)
  const providerRef = useRef<WebsocketProvider | null>(null)
  const [doc, setDoc] = useState<Y.Doc | null>(null)
  const [provider, setProvider] = useState<WebsocketProvider | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isSynced, setIsSynced] = useState(false)
  const mountedRef = useRef(false)

  useEffect(() => {
    if (!token || !docId) return

    // In strict mode, effects run twice. Track that we're mounted.
    mountedRef.current = true
    let saveInterval: ReturnType<typeof setInterval> | null = null

    const ydoc = new Y.Doc()
    docRef.current = ydoc

    // Load persisted state first, then connect the WebSocket provider.
    loadState(docId, ydoc).then(() => {
      if (!mountedRef.current) {
        // Component unmounted while loading — bail out.
        ydoc.destroy()
        return
      }

      setDoc(ydoc)

      const yjsProvider = new WebsocketProvider(`${WS_BASE}/ws`, docId, ydoc, {
        params: { token },
        connect: true,
      })
      providerRef.current = yjsProvider
      setProvider(yjsProvider)

      yjsProvider.on('status', ({ status }: { status: string }) => {
        console.log('[Yjs] Connection status:', status)
        if (mountedRef.current) setIsConnected(status === 'connected')
      })

      yjsProvider.on('sync', (synced: boolean) => {
        console.log('[Yjs] Sync status:', synced)
        if (mountedRef.current) setIsSynced(synced)
      })

      yjsProvider.on('connection-error', (error: any) => {
        console.error('[Yjs] Provider error:', error)
      })

      // Periodically save the full document state.
      saveInterval = setInterval(() => {
        saveState(docId, ydoc)
      }, SAVE_INTERVAL_MS)
    })

    return () => {
      mountedRef.current = false

      if (saveInterval) clearInterval(saveInterval)

      // Save state one final time before disconnecting.
      if (docRef.current) {
        saveState(docId, docRef.current)
      }

      if (providerRef.current) {
        providerRef.current.disconnect()
        providerRef.current.destroy()
      }
      if (docRef.current) {
        docRef.current.destroy()
      }
      docRef.current = null
      providerRef.current = null
      setDoc(null)
      setProvider(null)
      setIsConnected(false)
      setIsSynced(false)
    }
  }, [docId, token])

  return {
    doc,
    provider,
    isConnected,
    isSynced,
  }
}
