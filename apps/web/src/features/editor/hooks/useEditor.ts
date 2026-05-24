import { useEffect, useRef } from 'react'
import { useEditor as useTiptapEditor, type AnyExtension } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import * as Y from 'yjs'
import type { WebsocketProvider } from 'y-websocket'

interface UseEditorOptions {
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

export function useEditor({
  doc,
  provider,
  currentUser,
  isReadOnly = false,
  isSynced = false,
  initialContent,
  onWordCountChange,
  onContentChange,
  onBootstrapContent,
}: UseEditorOptions) {
  const bootstrappedInitialContentRef = useRef(false)
  const extensions: AnyExtension[] = [StarterKit.configure({ history: false } as any)]

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
      editable: !isReadOnly,
      onUpdate: ({ editor }) => {
        const text = editor.getText()
        const words = text.trim().split(/\s+/).filter((w) => w.length > 0).length
        onWordCountChange?.(words)
        onContentChange?.(text)
      },
    },
    [doc, isReadOnly, provider],
  )

  useEffect(() => {
    if (!editor) return
    editor.setEditable(!isReadOnly)
  }, [editor, isReadOnly])

  useEffect(() => {
    if (!editor) return
    const text = editor.getText()
    const words = text.trim().split(/\s+/).filter((w) => w.length > 0).length
    onWordCountChange?.(words)
  }, [editor, onWordCountChange])

  useEffect(() => {
    bootstrappedInitialContentRef.current = false
  }, [doc])

  useEffect(() => {
    if (!editor || !doc || !isSynced || bootstrappedInitialContentRef.current) return

    bootstrappedInitialContentRef.current = true

    const legacyContent = initialContent?.trim()
    if (!legacyContent) return
    if (editor.getText().trim().length > 0) return

    editor.commands.setContent(legacyContent)
    onBootstrapContent?.(Y.encodeStateAsUpdate(doc))
  }, [doc, editor, initialContent, isSynced, onBootstrapContent])

  return editor
}
