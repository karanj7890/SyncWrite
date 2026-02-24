import { useState, useRef, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, useScroll, useMotionValueEvent } from 'framer-motion'
import { ArrowLeft, Share, MoreHorizontal } from 'lucide-react'
import { useDocument, useUpdateDocument } from '../features/documents/hooks/useDocuments'
import { Editor } from '../features/editor/components/Editor'
import { EditorSkeleton } from '../features/editor/components/EditorSkeleton'
import { StatusBar } from '../shared/components/layout/StatusBar'
import { Button } from '../shared/components/ui/Button'

export function EditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: document, isLoading, isError } = useDocument(id ?? '')
  const { mutate: saveDocument } = useUpdateDocument()

  const [wordCount, setWordCount] = useState(0)
  const [showHeader, setShowHeader] = useState(true)
  const [title, setTitle] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved')
  const lastScrollY = useRef(0)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const titleInitialized = useRef(false)
  // Refs so debounce callbacks always capture the latest values
  const titleRef = useRef('')
  const contentRef = useRef('')

  // Initialize title + content once after document loads
  useEffect(() => {
    if (document && !titleInitialized.current) {
      setTitle(document.title)
      titleRef.current = document.title
      contentRef.current = document.content
      titleInitialized.current = true
    }
  }, [document])

  // Warn before tab close/refresh when there are unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

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

  function triggerSave() {
    setSaveStatus('saving')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveDocument(
        { id: id!, title: titleRef.current, content: contentRef.current },
        {
          onSuccess: () => {
            setSaveStatus('saved')
            setIsDirty(false)
          },
          onError: () => setSaveStatus('error'),
        },
      )
    }, 1500)
  }

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newTitle = e.target.value
    setTitle(newTitle)
    titleRef.current = newTitle
    setIsDirty(true)
    triggerSave()
  }

  const handleContentChange = useCallback((content: string) => {
    contentRef.current = content
    setIsDirty(true)
    triggerSave()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, saveDocument])

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

        <div className="flex items-center gap-2">
          <span
            className={`text-xs mr-2 hidden sm:inline-block ${saveStatus === 'error' ? 'text-red-400' : 'text-slate-400'}`}
          >
            {statusLabel}
          </span>
          <Button variant="ghost" size="sm" className="hidden sm:flex">
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
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
          placeholder="Untitled"
          className="w-full text-4xl sm:text-5xl font-bold text-slate-900 mb-6 font-sans tracking-tight bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-slate-300"
        />

        <div className="h-px w-full bg-slate-100 mb-8" />

        <div className="h-[60vh]">
          <Editor
            initialContent={document.content}
            title={title}
            onContentChange={handleContentChange}
            onWordCountChange={setWordCount}
          />
        </div>
      </main>

      <StatusBar wordCount={wordCount} isSaving={saveStatus === 'saving'} />
    </div>
  )
}
