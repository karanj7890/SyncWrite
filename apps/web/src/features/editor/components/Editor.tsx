import { EditorContent } from '@tiptap/react'
import { Toolbar } from './Toolbar'
import { useEditor } from '../hooks/useEditor'
import type * as Y from 'yjs'
import type { WebsocketProvider } from 'y-websocket'
import '../../../styles/editor.css'

interface EditorProps {
  doc: Y.Doc | null
  provider: WebsocketProvider | null
  currentUser: { name: string; color: string }
  isReadOnly?: boolean
  isSynced?: boolean
  initialContent?: string
  onWordCountChange?: (count: number) => void
  onContentChange?: (contentPreview: string) => void
  onBootstrapContent?: (state: Uint8Array) => void
}

export function Editor({
  doc,
  provider,
  currentUser,
  isReadOnly = false,
  isSynced = false,
  initialContent,
  onWordCountChange,
  onContentChange,
  onBootstrapContent,
}: EditorProps) {
  const editor = useEditor({
    doc,
    provider,
    currentUser,
    isReadOnly,
    isSynced,
    initialContent,
    onWordCountChange,
    onContentChange,
    onBootstrapContent,
  })

  return (
    <div className="flex flex-col h-full">
      <Toolbar editor={editor} isReadOnly={isReadOnly} />
      <EditorContent editor={editor} className="flex-1 overflow-y-auto" />
    </div>
  )
}
