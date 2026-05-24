import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, useScroll, useMotionValueEvent } from 'framer-motion'
import { ArrowLeft, Eye, MoreHorizontal, Pencil, Share } from 'lucide-react'
import { useDocument, useUpdateDocument } from '../features/documents/hooks/useDocuments'
import { Editor } from '../features/editor/components/Editor'
import { EditorSkeleton } from '../features/editor/components/EditorSkeleton'
import { StatusBar } from '../shared/components/layout/StatusBar'
import { Button } from '../shared/components/ui/Button'
import { useYjsProvider } from '../features/editor/hooks/useYjsProvider'
import { useAwareness } from '../features/presence/hooks/useAwareness'
import { PresenceBar } from '../features/presence/components/PresenceBar'
import { useConnectionStatus } from '../shared/hooks/useWebSocket'
import { useAppStore } from '../store/useAppStore'
import { getUserColor } from '../shared/utils/color'
import { ShareModal } from '../features/sharing/components/ShareModal'

export function EditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const shareToken = searchParams.get('share') ?? undefined
  const { data: document, isLoading, isError } = useDocument(id ?? '', shareToken)
  const { mutate: saveDocument } = useUpdateDocument()
  const user = useAppStore((s) => s.user)

  const [wordCount, setWordCount] = useState(0)
  const [showHeader, setShowHeader] = useState(true)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved')
  const lastScrollY = useRef(0)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const titleInitialized = useRef(false)
  const titleRef = useRef('')
  const contentPreviewRef = useRef('')

  // Yjs collaboration
  const { doc, provider, isConnected, isSynced } = useYjsProvider(id ?? '', shareToken)
  const connectionStatus = useConnectionStatus(provider)
  const awarenessUsers = useAwareness(provider)

  const currentUser = {
    name: user?.name ?? 'Anonymous',
    color: getUserColor(user?.id ?? ''),
  }

  const accessRole = document?.accessRole ?? 'owner'
  const isReadOnly = accessRole === 'viewer'
  const canShare = accessRole === 'owner'

  useEffect(() => {
    titleInitialized.current = false
    setSaveStatus('saved')
    if (saveTimer.current) {
      clearTimeout(saveTimer.current)
      saveTimer.current = null
    }
  }, [id])

  // Initialize title once after document loads
  useEffect(() => {
    if (document && !titleInitialized.current) {
      setTitle(document.title)
      titleRef.current = document.title
      titleInitialized.current = true
    }
    if (document) {
      contentPreviewRef.current = document.content
    }
  }, [document])

  const { scrollY } = useScroll()
  useMotionValueEvent(scrollY, 'change', (latest) => {
    const direction = latest > lastScrollY.current ? 'down' : 'up'
    if (latest < 50) {
      setShowHeader(true)
    } else if (direction === 'down') {
      setShowHeader(false)
    } else {
      setShowHeader(true)
    }
    lastScrollY.current = latest
  })

  function scheduleDocumentSave() {
    if (!id || isReadOnly) return

    setSaveStatus('saving')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveDocument(
        { id, title: titleRef.current, content: contentPreviewRef.current, shareToken },
        {
          onSuccess: () => setSaveStatus('saved'),
          onError: () => setSaveStatus('error'),
        },
      )
    }, 1500)
  }

  useEffect(() => {
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current)
        saveTimer.current = null
      }
    }
  }, [])

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (isReadOnly) return
    const newTitle = e.target.value
    setTitle(newTitle)
    titleRef.current = newTitle
    scheduleDocumentSave()
  }

  if (isLoading) return <EditorSkeleton />

  if (isError || !document) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 gap-4">
        <p className="text-red-500 text-lg font-medium">Document not found.</p>
        <Button onClick={() => navigate('/documents')}>Back to Documents</Button>
      </div>
    )
  }

  const statusLabel =
    saveStatus === 'saving' ? 'Saving...' : saveStatus === 'error' ? 'Save failed' : 'Saved'
  const accessLabel = accessRole === 'viewer' ? 'Viewer' : accessRole === 'editor' ? 'Editor' : 'Owner'
  const hasLiveConnection = connectionStatus === 'connected' || isConnected
  const syncLabel = isReadOnly ? 'Read only' : hasLiveConnection || isSynced ? statusLabel : 'Syncing...'

  return (
    <div className="min-h-screen bg-white flex flex-col relative">
      {/* Sticky Header */}
      <motion.header
        initial={{ y: 0 }}
        animate={{ y: showHeader ? 0 : -100 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed top-0 left-0 right-0 h-14 bg-white/90 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-4 z-50"
      >
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={() => navigate('/documents')}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 transition-colors px-2 py-1 rounded-md hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Docs</span>
          </button>
          <span className="text-sm font-medium text-slate-900 truncate max-w-[200px]">
            {title || document.title}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Collaboration presence */}
          {awarenessUsers.length > 0 && <PresenceBar users={awarenessUsers} />}

          <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-500">
            {accessRole === 'viewer' ? <Eye className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
            {accessLabel}
          </span>

          {/* Connection status */}
          {(connectionStatus !== 'connected' || !isConnected) && (
            <span className="text-xs text-amber-500 hidden sm:inline-block">
              {connectionStatus === 'offline'
                ? 'Offline'
                : connectionStatus === 'disconnected'
                  ? 'Reconnecting...'
                  : 'Connecting...'}
            </span>
          )}

          {/* Title save status */}
          <span
            className={`text-xs hidden sm:inline-block ${saveStatus === 'error' ? 'text-red-400' : 'text-slate-400'}`}
          >
            {syncLabel}
          </span>

          {canShare && (
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:flex"
              onClick={() => setIsShareModalOpen(true)}
            >
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
          )}
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </motion.header>

      {/* Editor Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-8 py-32 sm:py-40">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          disabled={isReadOnly}
          placeholder="Untitled"
          className="w-full text-4xl sm:text-5xl font-bold text-slate-900 mb-6 font-sans tracking-tight bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-slate-300 disabled:cursor-not-allowed disabled:text-slate-500"
        />

        <div className="h-px w-full bg-slate-100 mb-8" />

        <div className="h-[60vh]">
          {doc && provider ? (
            <Editor
              doc={doc}
              provider={provider}
              currentUser={currentUser}
              isReadOnly={isReadOnly}
              onWordCountChange={setWordCount}
              onContentChange={(preview) => {
                contentPreviewRef.current = preview
                if (!isReadOnly) {
                  scheduleDocumentSave()
                }
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              Connecting to document...
            </div>
          )}
        </div>
      </main>

      <StatusBar wordCount={wordCount} isSaving={saveStatus === 'saving'} />

      {id && canShare && (
        <ShareModal
          documentId={id}
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}
    </div>
  )
}
