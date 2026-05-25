import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutGrid, List, Menu, Plus, Search } from 'lucide-react'
import { useDocuments, useDeleteDocument, useStarDocument, useTrashDocuments, useRestoreDocument, usePermanentDeleteDocument } from '../hooks/useDocuments'
import type { Document } from '@syncwrite/types'
import { DocumentCard } from './DocumentCard'
import { DocumentCardSkeleton } from './DocumentCardSkeleton'
import { EmptyState } from './EmptyState'
import { NewDocumentModal } from './NewDocumentModal'
import { Button } from '../../../shared/components/ui/Button'
import { Modal } from '../../../shared/components/ui/Modal'
import { cn } from '../../../shared/utils/cn'

type ViewMode = 'grid' | 'list'
type Section = 'all' | 'starred' | 'trash'

interface DocumentListProps {
  activeSection: Section
  onSectionChange: (section: Section) => void
  onOpenSidebar?: () => void
}

export function DocumentList({ activeSection, onSectionChange: _onSectionChange, onOpenSidebar }: DocumentListProps) {
  const { data: documents, isLoading, isError } = useDocuments()
  const isTrashSection = activeSection === 'trash'
  const { data: trashedDocuments, isLoading: isTrashLoading, isError: isTrashError } =
    useTrashDocuments(isTrashSection)
  const { mutate: deleteDocument } = useDeleteDocument()
  const { mutate: starDocument } = useStarDocument()
  const { mutate: restoreDocument } = useRestoreDocument()
  const { mutate: permanentDeleteDocument } = usePermanentDeleteDocument()
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [confirmPermanentDeleteId, setConfirmPermanentDeleteId] = useState<string | null>(null)

  const sectionLabel =
    activeSection === 'all' ? 'All Documents' : activeSection === 'starred' ? 'Starred' : 'Trash'

  const filteredDocs = (documents ?? []).filter((doc) => {
    if (activeSection === 'starred') return doc.starred
    return doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const sortedDocs = [...filteredDocs].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )

  const sortedTrashedDocs = [...(trashedDocuments ?? [])].sort(
    (a, b) => new Date(b.deletedAt ?? b.updatedAt).getTime() - new Date(a.deletedAt ?? a.updatedAt).getTime(),
  )

  function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    setConfirmDeleteId(id)
  }

  function handleStar(e: React.MouseEvent, doc: Document) {
    e.stopPropagation()
    starDocument({ id: doc.id, starred: !doc.starred })
  }

  function handleRestore(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    restoreDocument(id)
  }

  function handlePermanentDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    setConfirmPermanentDeleteId(id)
  }

  function handleConfirmDelete() {
    if (confirmDeleteId) deleteDocument(confirmDeleteId)
    setConfirmDeleteId(null)
  }

  function handleConfirmPermanentDelete() {
    if (confirmPermanentDeleteId) permanentDeleteDocument(confirmPermanentDeleteId)
    setConfirmPermanentDeleteId(null)
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white relative">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-100 bg-white/80 px-4 py-4 backdrop-blur-sm sm:px-8 sm:py-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3 flex-1">
            <button
              type="button"
              onClick={onOpenSidebar}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 md:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="min-w-0 whitespace-nowrap text-xl font-bold text-slate-900 sm:text-2xl">
              {sectionLabel}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-1.5 rounded-md transition-all',
                  viewMode === 'grid'
                    ? 'bg-white shadow-sm text-indigo-600'
                    : 'text-slate-500 hover:text-slate-700',
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-1.5 rounded-md transition-all',
                  viewMode === 'list'
                    ? 'bg-white shadow-sm text-indigo-600'
                    : 'text-slate-500 hover:text-slate-700',
                )}
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            <Button onClick={() => setIsModalOpen(true)} className="hidden sm:inline-flex">
              <Plus className="h-4 w-4 mr-2" />
              New Document
            </Button>
            <Button onClick={() => setIsModalOpen(true)} size="icon" className="sm:hidden" aria-label="New document">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <div className="hidden sm:block w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-50 border-none text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        {isTrashSection ? (
          <>
            {sortedTrashedDocs.length > 0 && (
              <p className="text-xs text-slate-400 mb-6">
                Items in trash are automatically deleted forever after 30 days.
              </p>
            )}
            {isTrashError ? (
              <div className="flex items-center justify-center h-48">
                <p className="text-red-500">Failed to load trash. Is the server running?</p>
              </div>
            ) : isTrashLoading ? (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                    : 'space-y-0'
                }
              >
                {[1, 2, 3].map((i) => (
                  <DocumentCardSkeleton key={i} viewMode={viewMode} />
                ))}
              </div>
            ) : sortedTrashedDocs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <p className="text-lg font-medium">Trash is empty</p>
                <p className="text-sm mt-1">Deleted documents will appear here</p>
              </div>
            ) : (
              <motion.div
                layout
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-20'
                    : 'flex flex-col space-y-0 pb-20'
                }
              >
                <AnimatePresence mode="popLayout">
                  {sortedTrashedDocs.map((doc) => (
                    <DocumentCard
                      key={doc.id}
                      document={doc}
                      viewMode={viewMode}
                      isTrash
                      onDelete={() => {}}
                      onStar={() => {}}
                      onRestore={(e) => handleRestore(e, doc.id)}
                      onPermanentDelete={(e) => handlePermanentDelete(e, doc.id)}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </>
        ) : isError ? (
          <div className="flex items-center justify-center h-48">
            <p className="text-red-500">Failed to load documents. Is the server running?</p>
          </div>
        ) : isLoading ? (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-0'
            }
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <DocumentCardSkeleton key={i} viewMode={viewMode} />
            ))}
          </div>
        ) : sortedDocs.length === 0 ? (
          <EmptyState onCreate={() => setIsModalOpen(true)} />
        ) : (
          <motion.div
            layout
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-20'
                : 'flex flex-col space-y-0 pb-20'
            }
          >
            <AnimatePresence mode="popLayout">
              {sortedDocs.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  viewMode={viewMode}
                  onDelete={(e) => handleDelete(e, doc.id)}
                  onStar={(e) => handleStar(e, doc)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <NewDocumentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <Modal
        isOpen={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        title="Move to Trash"
      >
        {(() => {
          const pendingDoc = (documents ?? []).find((d) => d.id === confirmDeleteId)
          return (
            <>
              <p className="text-sm text-slate-600 mb-6">
                Move{' '}
                <span className="font-semibold text-slate-900">"{pendingDoc?.title}"</span>{' '}
                to trash? You can restore it later or it will be permanently deleted after 30 days.
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setConfirmDeleteId(null)}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={handleConfirmDelete}>
                  Move to Trash
                </Button>
              </div>
            </>
          )
        })()}
      </Modal>

      <Modal
        isOpen={confirmPermanentDeleteId !== null}
        onClose={() => setConfirmPermanentDeleteId(null)}
        title="Delete Forever"
      >
        {(() => {
          const pendingDoc = (trashedDocuments ?? []).find((d) => d.id === confirmPermanentDeleteId)
          return (
            <>
              <p className="text-sm text-slate-600 mb-6">
                Permanently delete{' '}
                <span className="font-semibold text-slate-900">"{pendingDoc?.title}"</span>?
                This cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setConfirmPermanentDeleteId(null)}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={handleConfirmPermanentDelete}>
                  Delete Forever
                </Button>
              </div>
            </>
          )
        })()}
      </Modal>
    </div>
  )
}
