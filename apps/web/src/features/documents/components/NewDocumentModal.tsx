import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Users, StickyNote } from 'lucide-react'
import { useCreateDocument } from '../hooks/useDocuments'
import { Modal } from '../../../shared/components/ui/Modal'
import { Input } from '../../../shared/components/ui/Input'
import { Button } from '../../../shared/components/ui/Button'
import { cn } from '../../../shared/utils/cn'

interface NewDocumentModalProps {
  isOpen: boolean
  onClose: () => void
}

const TEMPLATES = [
  { id: 'blank', name: 'Blank', icon: FileText, description: 'Start from scratch' },
  { id: 'meeting-notes', name: 'Meeting Notes', icon: Users, description: 'Team sync structure' },
  { id: 'notes', name: 'Notes', icon: StickyNote, description: 'Quick thoughts' },
] as const

type TemplateId = (typeof TEMPLATES)[number]['id']

export function NewDocumentModal({ isOpen, onClose }: NewDocumentModalProps) {
  const [title, setTitle] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('blank')
  const navigate = useNavigate()
  const { mutate: createDocument, isPending } = useCreateDocument()

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    createDocument(
      { title: title.trim() || 'Untitled' },
      {
        onSuccess: (doc) => {
          setTitle('')
          setSelectedTemplate('blank')
          onClose()
          navigate(`/documents/${doc.id}`)
        },
      },
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Document">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Input
            label="Title"
            placeholder="Untitled Document"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Start with a template
          </label>
          <div className="grid grid-cols-3 gap-3">
            {TEMPLATES.map((template) => {
              const Icon = template.icon
              const isSelected = selectedTemplate === template.id
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setSelectedTemplate(template.id)}
                  className={cn(
                    'flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 text-center h-32',
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                      : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50',
                  )}
                >
                  <div
                    className={cn(
                      'p-2 rounded-lg mb-2 transition-colors',
                      isSelected ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500',
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span
                    className={cn(
                      'text-sm font-medium',
                      isSelected ? 'text-indigo-900' : 'text-slate-700',
                    )}
                  >
                    {template.name}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1">{template.description}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isPending}>
            Create Document
          </Button>
        </div>
      </form>
    </Modal>
  )
}
