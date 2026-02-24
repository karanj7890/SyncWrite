import type { Editor } from '@tiptap/react'
import { Bold, Italic, Underline, Strikethrough, Code, List, ListOrdered } from 'lucide-react'
import { cn } from '../../../shared/utils/cn'

interface ToolbarButtonProps {
  onClick: () => void
  active: boolean
  title: string
  children: React.ReactNode
}

function ToolbarButton({ onClick, active, title, children }: ToolbarButtonProps) {
  return (
    <button
      onMouseDown={(e) => {
        e.preventDefault() // prevent editor from losing focus on click
        onClick()
      }}
      title={title}
      className={cn(
        'p-1.5 rounded-md text-slate-500 transition-colors',
        active ? 'bg-slate-200 text-slate-900' : 'hover:bg-slate-100 hover:text-slate-700',
      )}
    >
      {children}
    </button>
  )
}

const HEADING_OPTIONS = [
  { label: 'Normal', level: 0 },
  { label: 'Large',  level: 2 },
  { label: 'Larger', level: 1 },
] as const

interface ToolbarProps {
  editor: Editor | null
}

export function Toolbar({ editor }: ToolbarProps) {
  if (!editor) return null

  const currentHeading = editor.isActive('heading', { level: 1 })
    ? 'Larger'
    : editor.isActive('heading', { level: 2 })
      ? 'Large'
      : 'Normal'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain = () => (editor.chain().focus() as any)

  function handleHeadingChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const option = HEADING_OPTIONS.find((o) => o.label === e.target.value)
    if (!option) return
    if (option.level === 0) {
      chain().setParagraph().run()
    } else {
      chain().toggleHeading({ level: option.level }).run()
    }
  }

  return (
    <div className="flex items-center gap-0.5 pb-3 mb-4 border-b border-slate-100">
      <ToolbarButton
        onClick={() => chain().toggleBold().run()}
        active={editor.isActive('bold')}
        title="Bold (⌘B)"
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => chain().toggleItalic().run()}
        active={editor.isActive('italic')}
        title="Italic (⌘I)"
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => chain().toggleUnderline().run()}
        active={editor.isActive('underline')}
        title="Underline (⌘U)"
      >
        <Underline className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => chain().toggleStrike().run()}
        active={editor.isActive('strike')}
        title="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>

      <div className="w-px h-5 bg-slate-200 mx-1.5" />

      <select
        value={currentHeading}
        onChange={handleHeadingChange}
        className="text-sm text-slate-600 border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
      >
        {HEADING_OPTIONS.map((o) => (
          <option key={o.label} value={o.label}>
            {o.label}
          </option>
        ))}
      </select>

      <ToolbarButton
        onClick={() => chain().toggleCodeBlock().run()}
        active={editor.isActive('codeBlock')}
        title="Code Block"
      >
        <Code className="h-4 w-4" />
      </ToolbarButton>

      <div className="w-px h-5 bg-slate-200 mx-1.5" />

      <ToolbarButton
        onClick={() => chain().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => chain().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        title="Numbered List"
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
    </div>
  )
}
