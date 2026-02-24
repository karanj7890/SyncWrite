import { motion, AnimatePresence } from 'framer-motion'
import { Check, Loader2 } from 'lucide-react'

interface StatusBarProps {
  wordCount: number
  isSaving: boolean
}

export function StatusBar({ wordCount, isSaving }: StatusBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-10 bg-white border-t border-slate-200 flex items-center justify-between px-6 text-xs text-slate-500 z-40">
      <div className="font-medium tabular-nums">{wordCount} words</div>

      <div className="flex items-center gap-2">
        <AnimatePresence mode="wait">
          {isSaving ? (
            <motion.div
              key="saving"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex items-center gap-1.5 text-slate-400"
            >
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Saving...</span>
            </motion.div>
          ) : (
            <motion.div
              key="saved"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex items-center gap-1.5 text-green-600"
            >
              <Check className="h-3 w-3" />
              <span>Saved</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
