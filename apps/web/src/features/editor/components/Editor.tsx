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
  onWordCountChange?: (count: number) => void
  onContentChange?: (contentPreview: string) => void
}

export function Editor({
  doc,
  provider,
  currentUser,
  isReadOnly = false,
  onWordCountChange,
  onContentChange,
}: EditorProps) {
  const editor = useEditor({
    doc,
    provider,
    currentUser,
    isReadOnly,
    onWordCountChange,
    onContentChange,
  })

  return (
    <div className="flex flex-col h-full">
      <Toolbar editor={editor} isReadOnly={isReadOnly} />
      <EditorContent editor={editor} className="flex-1 overflow-y-auto" />
    </div>
  )
}
