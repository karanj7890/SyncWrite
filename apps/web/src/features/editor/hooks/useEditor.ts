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
  onWordCountChange?: (count: number) => void
}

export function useEditor({ doc, provider, currentUser, onWordCountChange }: UseEditorOptions) {
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

  return useTiptapEditor(
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
      },
    },
    [doc, provider],
  )
}
