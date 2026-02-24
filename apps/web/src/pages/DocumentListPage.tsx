import { useState } from 'react'
import { Sidebar } from '../shared/components/layout/Sidebar'
import { DocumentList } from '../features/documents/components/DocumentList'

type Section = 'all' | 'starred' | 'trash'

export function DocumentListPage() {
  const [activeSection, setActiveSection] = useState<Section>('all')

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Sidebar – hidden on mobile */}
      <div className="hidden md:block h-full">
        <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      </div>

      {/* Main content */}
      <DocumentList activeSection={activeSection} onSectionChange={setActiveSection} />
    </div>
  )
}
