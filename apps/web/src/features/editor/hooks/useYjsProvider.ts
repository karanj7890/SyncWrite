import { useEffect, useRef, useState } from 'react'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { useAppStore } from '../../../store/useAppStore'
import { applyStoredYjsState, createYDoc } from '../../../lib/yjs'
import { getDocumentYjsState } from '../../documents/api/documents.api'

const WS_BASE = (import.meta.env.VITE_WS_URL as string | undefined) ?? 'ws://localhost:8080'

function normalizeWebSocketUrl(rawBase: string): string {
  const trimmed = rawBase.trim().replace(/\/+$/, '')

  if (!trimmed) {
    return 'ws://localhost:8080/ws'
  }

  const withProtocol = /^[a-z]+:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  const url = new URL(withProtocol)

  if (url.protocol === 'http:') url.protocol = 'ws:'
  if (url.protocol === 'https:') url.protocol = 'wss:'

  if (!url.pathname || url.pathname === '/') {
    url.pathname = '/ws'
  } else if (!url.pathname.endsWith('/ws')) {
    url.pathname = `${url.pathname.replace(/\/+$/, '')}/ws`
  }

  return url.toString().replace(/\/+$/, '')
}

interface UseYjsProviderResult {
  doc: Y.Doc | null
  provider: WebsocketProvider | null
  isConnected: boolean
  isSynced: boolean
  isHydrated: boolean
  hasPersistedState: boolean
}

export function useYjsProvider(docId: string, shareToken?: string): UseYjsProviderResult {
  const token = useAppStore((s) => s.token)
  const docRef = useRef<Y.Doc | null>(null)
  const providerRef = useRef<WebsocketProvider | null>(null)
  const [doc, setDoc] = useState<Y.Doc | null>(null)
  const [provider, setProvider] = useState<WebsocketProvider | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isSynced, setIsSynced] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [hasPersistedState, setHasPersistedState] = useState(false)
  const mountedRef = useRef(false)

  useEffect(() => {
    if (!token || !docId) return

    // In strict mode, effects run twice. Track that we're mounted.
    mountedRef.current = true

    const ydoc = createYDoc()
    docRef.current = ydoc
    setDoc(ydoc)
    setIsHydrated(false)
    setHasPersistedState(false)

    const yjsProvider = new WebsocketProvider(normalizeWebSocketUrl(WS_BASE), docId, ydoc, {
      params: shareToken ? { token, share: shareToken } : { token },
      connect: false,
    })
    providerRef.current = yjsProvider
    setProvider(yjsProvider)

    yjsProvider.on('status', ({ status }: { status: string }) => {
      console.log('[Yjs] Connection status:', status)
      if (!mountedRef.current) return
      const connected = status === 'connected'
      setIsConnected(connected)
      if (!connected) {
        setIsSynced(false)
      }
    })

    yjsProvider.on('sync', (synced: boolean) => {
      console.log('[Yjs] Sync status:', synced)
      if (mountedRef.current) setIsSynced(synced)
    })

    yjsProvider.on('connection-error', (error: any) => {
      console.error('[Yjs] Provider error:', error)
    })

    async function hydrateDocumentState() {
      try {
        const savedState = await getDocumentYjsState(docId, shareToken)
        if (!mountedRef.current) return

        if (savedState?.length) {
          const applied = applyStoredYjsState(ydoc, savedState)
          if (applied) {
            setHasPersistedState(true)
          } else {
            console.warn('[Yjs] Failed to decode persisted state, falling back to websocket sync')
          }
        }
      } catch (error) {
        console.error('[Yjs] Failed to hydrate persisted state:', error)
      } finally {
        if (!mountedRef.current) return
        setIsHydrated(true)
        yjsProvider.connect()
      }
    }

    void hydrateDocumentState()

    return () => {
      mountedRef.current = false

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
      setIsHydrated(false)
      setHasPersistedState(false)
    }
  }, [docId, shareToken, token])

  return {
    doc,
    provider,
    isConnected,
    isSynced,
    isHydrated,
    hasPersistedState,
  }
}
