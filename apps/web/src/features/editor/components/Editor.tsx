import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { Toolbar } from './Toolbar'
import '../../../styles/editor.css'

interface EditorProps {
  initialContent: string
  title: string
  onContentChange?: (content: string) => void
  onWordCountChange?: (count: number) => void
}

export function Editor({ initialContent, title: _title, onContentChange, onWordCountChange }: EditorProps) {
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: initialContent || '',
    editorProps: {
      attributes: {
        class: 'editor-content focus:outline-none',
        spellcheck: 'false',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onContentChange?.(html)

      const text = editor.getText()
      const words = text.trim().split(/\s+/).filter((w) => w.length > 0).length
      onWordCountChange?.(words)
    },
    onCreate: ({ editor }) => {
      const text = editor.getText()
      const words = text.trim().split(/\s+/).filter((w) => w.length > 0).length
      onWordCountChange?.(words)
    },
  })

  return (
    <div className="flex flex-col h-full">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} className="flex-1 overflow-y-auto" />
    </div>
  )
}
