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
  initialContent?: string
  onWordCountChange?: (count: number) => void
  onContentChange?: (html: string) => void
  onInitialContentHydrated?: () => void
}

export function Editor({
  doc,
  provider,
  currentUser,
  initialContent,
  onWordCountChange,
  onContentChange,
  onInitialContentHydrated,
}: EditorProps) {
  const editor = useEditor({
    doc,
    provider,
    currentUser,
    initialContent,
    onWordCountChange,
    onContentChange,
    onInitialContentHydrated,
  })

  return (
    <div className="flex flex-col h-full">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} className="flex-1 overflow-y-auto" />
    </div>
  )
}
