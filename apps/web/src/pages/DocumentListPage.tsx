import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { Sidebar } from '../shared/components/layout/Sidebar'
import { DocumentList } from '../features/documents/components/DocumentList'

type Section = 'all' | 'starred' | 'trash'

export function DocumentListPage() {
  const [activeSection, setActiveSection] = useState<Section>('all')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-900/30 md:hidden"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Close navigation"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'tween', duration: 0.2 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-50 md:hidden"
            >
              <div className="flex h-14 items-center justify-end border-b border-slate-200 px-4">
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  aria-label="Close sidebar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <Sidebar
                activeSection={activeSection}
                onSectionChange={setActiveSection}
                onNavigate={() => setIsSidebarOpen(false)}
                className="h-[calc(100%-56px)]"
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="hidden md:block h-full">
        <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      </div>

      {/* Main content */}
      <DocumentList
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onOpenSidebar={() => setIsSidebarOpen(true)}
      />
    </div>
  )
}
