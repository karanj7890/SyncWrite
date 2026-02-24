import { motion } from 'framer-motion'
import { FileText, Plus } from 'lucide-react'
import { Button } from '../../../shared/components/ui/Button'

interface EmptyStateProps {
  onCreate: () => void
}

export function EmptyState({ onCreate }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-24 text-center px-4"
    >
      <div className="bg-slate-50 p-6 rounded-full mb-6">
        <FileText className="h-12 w-12 text-slate-300" />
      </div>

      <h3 className="text-xl font-semibold text-slate-900 mb-2">No documents yet</h3>

      <p className="text-slate-500 max-w-md mb-8">
        Your documents will appear here. Start writing something great and share it with your team.
      </p>

      <Button onClick={onCreate} size="lg" className="group">
        <Plus className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
        Create your first doc
      </Button>
    </motion.div>
  )
}
