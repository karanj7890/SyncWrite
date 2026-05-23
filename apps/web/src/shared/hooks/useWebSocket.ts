import { useEffect, useState } from 'react'
import type { WebsocketProvider } from 'y-websocket'

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'offline'

export function useConnectionStatus(provider: WebsocketProvider | null): ConnectionStatus {
  const [status, setStatus] = useState<ConnectionStatus>('connecting')

  useEffect(() => {
    if (!provider) return

    function handleStatus({ status: s }: { status: string }) {
      if (!navigator.onLine) {
        setStatus('offline')
      } else {
        setStatus(s === 'connected' ? 'connected' : 'connecting')
      }
    }

    function handleOnline() {
      provider!.connect()
      setStatus('connecting')
    }

    function handleOffline() {
      setStatus('offline')
    }

    provider.on('status', handleStatus)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      provider.off('status', handleStatus)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [provider])

  return status
}
