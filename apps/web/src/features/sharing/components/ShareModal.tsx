import { useMemo, useState } from 'react'
import { Copy, Eye, Link2, Pencil, Trash2 } from 'lucide-react'
import { Modal } from '../../../shared/components/ui/Modal'
import { Button } from '../../../shared/components/ui/Button'
import {
  useCreateDocumentShare,
  useDocumentShares,
  useRevokeDocumentShare,
} from '../../documents/hooks/useDocuments'

interface ShareModalProps {
  documentId: string
  isOpen: boolean
  onClose: () => void
}

type ShareRole = 'viewer' | 'editor'

export function ShareModal({ documentId, isOpen, onClose }: ShareModalProps) {
  const [role, setRole] = useState<ShareRole>('editor')
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const { data: shares = [], isLoading } = useDocumentShares(documentId, isOpen)
  const { mutate: createShare, isPending: isCreating } = useCreateDocumentShare()
  const { mutate: revokeShare, isPending: isRevoking } = useRevokeDocumentShare()

  const activeShares = useMemo(
    () => shares.filter((share) => !share.revokedAt),
    [shares],
  )

  function getShareUrl(token: string) {
    return `${window.location.origin}/documents/${documentId}?share=${token}`
  }

  async function copyShareLink(token: string) {
    const url = getShareUrl(token)
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url)
      setCopiedToken(token)
      window.setTimeout(() => setCopiedToken((current) => (current === token ? null : current)), 2000)
    }
  }

  function handleCreateShare() {
    createShare(
      { id: documentId, body: { role } },
      {
        onSuccess: async (share) => {
          await copyShareLink(share.token)
        },
      },
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Document">
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-900">Create a logged-in access link</p>
          <p className="mt-1 text-sm text-slate-500">
            Anyone with the link must still sign in. Choose whether they can only read or actively edit.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setRole('viewer')}
              className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                role === 'viewer'
                  ? 'border-slate-900 bg-white text-slate-900'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 text-sm font-medium">
                <Eye className="h-4 w-4" />
                Viewer
              </div>
              <p className="mt-1 text-xs">Can open the document and follow live changes.</p>
            </button>

            <button
              type="button"
              onClick={() => setRole('editor')}
              className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                role === 'editor'
                  ? 'border-slate-900 bg-white text-slate-900'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 text-sm font-medium">
                <Pencil className="h-4 w-4" />
                Editor
              </div>
              <p className="mt-1 text-xs">Can edit the title and collaborate in the live editor.</p>
            </button>
          </div>

          <Button
            onClick={handleCreateShare}
            isLoading={isCreating}
            className="mt-4 w-full sm:w-auto"
          >
            <Link2 className="mr-2 h-4 w-4" />
            Create {role} link
          </Button>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-slate-900">Active links</h4>
            {activeShares.length > 0 && (
              <span className="text-xs text-slate-400">{activeShares.length} active</span>
            )}
          </div>

          <div className="mt-3 space-y-3">
            {isLoading && <p className="text-sm text-slate-500">Loading links...</p>}

            {!isLoading && activeShares.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                No share links yet.
              </div>
            )}

            {activeShares.map((share) => (
              <div
                key={share.id}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                      {share.role === 'editor' ? (
                        <Pencil className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      <span className="capitalize">{share.role} link</span>
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-500">{getShareUrl(share.token)}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyShareLink(share.token)}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      {copiedToken === share.token ? 'Copied' : 'Copy'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => revokeShare({ id: documentId, shareId: share.id })}
                      disabled={isRevoking}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Revoke
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}
