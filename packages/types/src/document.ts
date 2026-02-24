export interface Document {
  id: string
  title: string
  content: string
  starred: boolean
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface CreateDocumentRequest {
  title: string
}

export interface UpdateDocumentRequest {
  title: string
  content: string
}
