import { useEffect, useRef, useState } from 'react'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { useAppStore } from '../../../store/useAppStore'
import { createYDoc } from '../../../lib/yjs'

const WS_BASE = (import.meta.env.VITE_WS_URL as string | undefined) ?? 'ws://localhost:8080'

interface UseYjsProviderResult {
  doc: Y.Doc | null
  provider: WebsocketProvider | null
  isConnected: boolean
  isSynced: boolean
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

    const ydoc = createYDoc()
    docRef.current = ydoc
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
    }
  }, [docId, token])

  return {
    doc,
    provider,
    isConnected,
    isSynced,
  }
}
