import { motion } from 'framer-motion'
import { FileText, Trash2, ArrowRight, MoreHorizontal, Star, RotateCcw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Document } from '@syncwrite/types'
import { cn } from '../../../shared/utils/cn'
import { getDocColor, formatTimeAgo, stripHtml } from '../../../shared/utils/color'

interface DocumentCardProps {
  document: Document
  viewMode: 'grid' | 'list'
  onDelete: (e: React.MouseEvent) => void
  onStar: (e: React.MouseEvent) => void
  isTrash?: boolean
  onRestore?: (e: React.MouseEvent) => void
  onPermanentDelete?: (e: React.MouseEvent) => void
}

export function DocumentCard({ document, viewMode, onDelete, onStar, isTrash, onRestore, onPermanentDelete }: DocumentCardProps) {
  const navigate = useNavigate()
  const { id, title, content, updatedAt, starred, deletedAt } = document
  const colorClass = getDocColor(id)

  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileHover={{ backgroundColor: 'rgba(248, 250, 252, 1)' }}
        onClick={() => navigate(`/documents/${id}`)}
        className="group flex items-center gap-4 p-3 border-b border-slate-100 cursor-pointer transition-colors"
      >
        <div className={cn('p-2 rounded-lg', colorClass)}>
          <FileText className="h-5 w-5 text-slate-600" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-slate-900 truncate">{title}</h3>
        </div>

        <div className="flex items-center gap-6 text-sm text-slate-500">
          <span className="hidden sm:block">
            {isTrash && deletedAt ? `Deleted ${formatTimeAgo(deletedAt)}` : formatTimeAgo(updatedAt)}
          </span>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {isTrash ? (
              <>
                <button
                  onClick={onRestore}
                  className="p-1.5 rounded-md hover:bg-green-50 text-slate-400 hover:text-green-600 transition-colors"
                  title="Restore"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  onClick={onPermanentDelete}
                  className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                  title="Delete forever"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onStar}
                  className={cn(
                    'p-1.5 rounded-md transition-colors',
                    starred
                      ? 'text-amber-400'
                      : 'text-slate-400 hover:text-amber-400',
                  )}
                  title={starred ? 'Unstar' : 'Star'}
                >
                  <Star className={cn('h-4 w-4', starred && 'fill-amber-400')} />
                </button>
                <button
                  onClick={onDelete}
                  className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button className="p-1.5 rounded-md hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{
        y: -4,
        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
      }}
      whileTap={{ scale: 0.98 }}
      onClick={() => !isTrash && navigate(`/documents/${id}`)}
      className={cn(
        'group relative bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[280px]',
        isTrash ? 'cursor-default opacity-80' : 'cursor-pointer',
      )}
    >
      {/* Hover left border strip */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Color Strip */}
      <div className={cn('h-3 w-full', colorClass)} />

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <div className="p-2 rounded-lg bg-slate-50 text-slate-400 group-hover:text-indigo-500 transition-colors">
            <FileText className="h-5 w-5" />
          </div>
          {!isTrash && (
            <button
              onClick={onStar}
              className={cn(
                'p-1.5 rounded-full transition-colors',
                starred
                  ? 'text-amber-400'
                  : 'opacity-0 group-hover:opacity-100 text-slate-300 hover:text-amber-400',
              )}
              title={starred ? 'Unstar' : 'Star'}
            >
              <Star className={cn('h-4 w-4', starred && 'fill-amber-400')} />
            </button>
          )}
        </div>

        <h3 className="font-semibold text-lg text-slate-900 mb-2 line-clamp-2 leading-tight">
          {title}
        </h3>

        <p className="text-sm text-slate-500 line-clamp-3 mb-4 flex-1">
          {stripHtml(content) || 'No content yet...'}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
          <span className="text-xs text-slate-400 font-medium">
            {isTrash && deletedAt ? `Deleted ${formatTimeAgo(deletedAt)}` : formatTimeAgo(updatedAt)}
          </span>

          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
            {isTrash ? (
              <>
                <button
                  onClick={onRestore}
                  className="p-1.5 rounded-full hover:bg-green-50 text-slate-400 hover:text-green-600 transition-colors"
                  title="Restore"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={onPermanentDelete}
                  className="p-1.5 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                  title="Delete forever"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onDelete}
                  className="p-1.5 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <div className="p-1.5 rounded-full bg-indigo-50 text-indigo-600">
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
