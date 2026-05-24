import { useEffect, useState } from 'react'
import type { WebsocketProvider } from 'y-websocket'

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'offline'

export function useConnectionStatus(provider: WebsocketProvider | null): ConnectionStatus {
  const [status, setStatus] = useState<ConnectionStatus>(
    typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'connecting',
  )

  useEffect(() => {
    if (!provider) return
    const wsProvider = provider

    function handleStatus({ status: s }: { status: 'connected' | 'disconnected' | 'connecting' }) {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setStatus('offline')
        return
      }
      setStatus(s)
    }

    function handleOnline() {
      wsProvider.connect()
      setStatus('connecting')
    }

    function handleOffline() {
      setStatus('offline')
    }

    wsProvider.on('status', handleStatus)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      wsProvider.off('status', handleStatus)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [provider])

  return status
}
