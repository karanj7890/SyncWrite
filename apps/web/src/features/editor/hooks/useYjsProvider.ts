import { useEffect, useRef, useState } from 'react'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { useAppStore } from '../../../store/useAppStore'
import { api } from '../../../lib/axios'

const WS_BASE = (import.meta.env.VITE_WS_URL as string | undefined) ?? 'ws://localhost:8080'
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8080'
const SAVE_INTERVAL_MS = 30_000 // save every 30 seconds
const SAVE_DEBOUNCE_MS = 750

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
async function saveState(docId: string, ydoc: Y.Doc, token: string): Promise<void> {
  const state = Y.encodeStateAsUpdate(ydoc)
  const buffer = state.buffer.slice(state.byteOffset, state.byteOffset + state.byteLength) as ArrayBuffer
  const res = await fetch(`${API_BASE}/api/documents/${docId}/state`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/octet-stream',
    },
    body: new Blob([buffer], { type: 'application/octet-stream' }),
    keepalive: true,
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`save failed with status ${res.status}`)
  }
}

export function useYjsProvider(docId: string): UseYjsProviderResult {
  const token = useAppStore((s) => s.token)
  const docRef = useRef<Y.Doc | null>(null)
  const providerRef = useRef<WebsocketProvider | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveInFlightRef = useRef(false)
  const saveQueuedRef = useRef(false)
  const readyToPersistRef = useRef(false)
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
    readyToPersistRef.current = false

    const flushSave = async () => {
      if (!mountedRef.current || !readyToPersistRef.current || !docRef.current || !token) {
        saveQueuedRef.current = true
        return
      }
      if (saveInFlightRef.current) {
        saveQueuedRef.current = true
        return
      }

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
        saveTimerRef.current = null
      }

      saveQueuedRef.current = false

      saveInFlightRef.current = true
      try {
        await saveState(docId, docRef.current, token)
        if (saveQueuedRef.current) {
          scheduleSave()
        }
      } catch (err) {
        saveQueuedRef.current = true
        console.warn('[Yjs] Failed to save state:', err)
        scheduleSave()
      } finally {
        saveInFlightRef.current = false
      }
    }

    const scheduleSave = () => {
      if (!mountedRef.current) return
      saveQueuedRef.current = true
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        saveTimerRef.current = null
        void flushSave()
      }, SAVE_DEBOUNCE_MS)
    }

    const handleYDocUpdate = (_update: Uint8Array, transaction: Y.Transaction) => {
      if (!transaction.local) return
      saveQueuedRef.current = true
      scheduleSave()
    }

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

      ydoc.on('update', handleYDocUpdate)

      // Periodically save the full document state.
      saveInterval = setInterval(() => {
        void flushSave()
      }, SAVE_INTERVAL_MS)

      readyToPersistRef.current = true
      if (saveQueuedRef.current) {
        void flushSave()
      }
    })

    return () => {
      mountedRef.current = false

      if (saveInterval) clearInterval(saveInterval)
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
        saveTimerRef.current = null
      }

      // Save state one final time before disconnecting.
      if (docRef.current) {
        void flushSave()
      }

      if (docRef.current) {
        docRef.current.off('update', handleYDocUpdate)
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
