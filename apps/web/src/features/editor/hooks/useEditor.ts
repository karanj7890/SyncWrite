import { useEffect, useRef } from 'react'
import { useEditor as useTiptapEditor, type AnyExtension } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import type * as Y from 'yjs'
import type { WebsocketProvider } from 'y-websocket'

interface UseEditorOptions {
  doc: Y.Doc | null
  provider: WebsocketProvider | null
  currentUser: { name: string; color: string }
  initialContent?: string
  onWordCountChange?: (count: number) => void
  onContentChange?: (html: string) => void
  onInitialContentHydrated?: () => void
}

export function useEditor({
  doc,
  provider,
  currentUser,
  initialContent,
  onWordCountChange,
  onContentChange,
  onInitialContentHydrated,
}: UseEditorOptions) {
  const hydratedRef = useRef(false)
  const extensions: AnyExtension[] = [
    StarterKit,
  ]

  // Only add collaboration extensions when both doc and provider are available
  if (doc && provider) {
    extensions.push(
      Collaboration.configure({ document: doc }),
      CollaborationCursor.configure({
        provider,
        user: { name: currentUser.name, color: currentUser.color },
      }),
    )
  }

  const editor = useTiptapEditor(
    {
      extensions,
      editorProps: {
        attributes: {
          class: 'editor-content focus:outline-none',
          spellcheck: 'false',
        },
      },
      onUpdate: ({ editor }) => {
        const text = editor.getText()
        const words = text.trim().split(/\s+/).filter((w) => w.length > 0).length
        onWordCountChange?.(words)
        onContentChange?.(editor.getHTML())
      },
    },
    [doc, provider],
  )

  useEffect(() => {
    if (!editor || hydratedRef.current) return
    if (!initialContent) return
    if (!editor.isEmpty) {
      hydratedRef.current = true
      return
    }

    editor.commands.setContent(initialContent)
    const text = editor.getText()
    const words = text.trim().split(/\s+/).filter((w) => w.length > 0).length
    onWordCountChange?.(words)
    onContentChange?.(editor.getHTML())
    queueMicrotask(() => {
      void onInitialContentHydrated?.()
    })
    hydratedRef.current = true
  }, [editor, initialContent, onContentChange, onInitialContentHydrated, onWordCountChange])

  return editor
}
