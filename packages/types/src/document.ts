export interface Document {
  id: string
  title: string
  content: string
  starred: boolean
  createdAt: string
  updatedAt: string
  deletedAt?: string
  accessRole?: 'owner' | 'viewer' | 'editor'
}

export interface CreateDocumentRequest {
  title: string
}

export interface UpdateDocumentRequest {
  title?: string
  content?: string
}

export interface DocumentShare {
  id: string
  role: 'viewer' | 'editor'
  token: string
  createdAt: string
  revokedAt?: string
}

export interface CreateShareRequest {
  role: 'viewer' | 'editor'
}
