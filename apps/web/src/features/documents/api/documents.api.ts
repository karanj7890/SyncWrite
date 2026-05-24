import type {
  Document,
  CreateDocumentRequest,
  UpdateDocumentRequest,
  DocumentShare,
  CreateShareRequest,
} from '@syncwrite/types'
import { api } from '../../../lib/axios'

export async function listDocuments(): Promise<Document[]> {
  const res = await api.get<Document[]>('/api/documents')
  return res.data
}

export async function getDocument(id: string, shareToken?: string): Promise<Document> {
  const res = await api.get<Document>(`/api/documents/${id}`, {
    params: shareToken ? { share: shareToken } : undefined,
  })
  return res.data
}

export async function createDocument(body: CreateDocumentRequest): Promise<Document> {
  const res = await api.post<Document>('/api/documents', body)
  return res.data
}

export async function updateDocument(
  id: string,
  body: UpdateDocumentRequest,
  shareToken?: string,
): Promise<Document> {
  const res = await api.patch<Document>(`/api/documents/${id}`, body, {
    params: shareToken ? { share: shareToken } : undefined,
  })
  return res.data
}

export async function deleteDocument(id: string): Promise<void> {
  await api.delete(`/api/documents/${id}`)
}

export async function starDocument(id: string, starred: boolean): Promise<Document> {
  const res = await api.patch<Document>(`/api/documents/${id}/star`, { starred })
  return res.data
}

export async function listTrashedDocuments(): Promise<Document[]> {
  const res = await api.get<Document[]>('/api/documents/trash')
  return res.data
}

export async function restoreDocument(id: string): Promise<Document> {
  const res = await api.post<Document>(`/api/documents/${id}/restore`)
  return res.data
}

export async function permanentDeleteDocument(id: string): Promise<void> {
  await api.delete(`/api/documents/${id}/permanent`)
}

export async function listDocumentShares(id: string): Promise<DocumentShare[]> {
  const res = await api.get<DocumentShare[]>(`/api/documents/${id}/shares`)
  return res.data
}

export async function createDocumentShare(
  id: string,
  body: CreateShareRequest,
): Promise<DocumentShare> {
  const res = await api.post<DocumentShare>(`/api/documents/${id}/shares`, body)
  return res.data
}

export async function revokeDocumentShare(id: string, shareId: string): Promise<void> {
  await api.delete(`/api/documents/${id}/shares/${shareId}`)
}

export async function saveDocumentYjsState(
  id: string,
  state: Uint8Array,
  shareToken?: string,
): Promise<void> {
  await api.put(`/api/documents/${id}/state`, state, {
    params: shareToken ? { share: shareToken } : undefined,
    headers: {
      'Content-Type': 'application/octet-stream',
    },
  })
}
