import { useEffect, useState } from 'react'
import type { WebsocketProvider } from 'y-websocket'

export interface AwarenessUser {
  name: string
  color: string
  clientId: number
}

export function useAwareness(provider: WebsocketProvider | null): AwarenessUser[] {
  const [users, setUsers] = useState<AwarenessUser[]>([])

  useEffect(() => {
    if (!provider) return

    const awareness = provider.awareness

    function update() {
      const remoteUsers: AwarenessUser[] = []
      awareness.getStates().forEach((state, clientId) => {
        if (clientId !== awareness.clientID && state.user) {
          remoteUsers.push({
            name: (state.user as { name?: string }).name ?? 'Unknown',
            color: (state.user as { color?: string }).color ?? '#94a3b8',
            clientId,
          })
        }
      })
      // Use microtask to defer state update and avoid React render warnings
      Promise.resolve().then(() => {
        setUsers(remoteUsers)
      })
    }

    awareness.on('change', update)
    // Initial update in a microtask to avoid synchronous state updates during render
    Promise.resolve().then(() => {
      update()
    })

    return () => {
      awareness.off('change', update)
    }
  }, [provider])

  return users
}
