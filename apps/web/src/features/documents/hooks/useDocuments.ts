import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listDocuments, getDocument, createDocument, updateDocument, deleteDocument, starDocument, listTrashedDocuments, restoreDocument, permanentDeleteDocument } from '../api/documents.api'
import type { CreateDocumentRequest, UpdateDocumentRequest, Document } from '@syncwrite/types'

const QUERY_KEYS = {
  all: ['documents'] as const,
  trash: ['documents', 'trash'] as const,
  detail: (id: string) => ['documents', id] as const,
}

export function useDocuments() {
  return useQuery({
    queryKey: QUERY_KEYS.all,
    queryFn: listDocuments,
  })
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.detail(id),
    queryFn: () => getDocument(id),
    enabled: !!id,
  })
}

export function useCreateDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateDocumentRequest) => createDocument(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all })
    },
  })
}

export function useUpdateDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & UpdateDocumentRequest) =>
      updateDocument(id, body),
    onSuccess: (doc) => {
      queryClient.setQueryData(QUERY_KEYS.detail(doc.id), doc)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all })
    },
  })
}

export function useDeleteDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteDocument(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.all })
      const previous = queryClient.getQueryData<Document[]>(QUERY_KEYS.all)
      queryClient.setQueryData<Document[]>(QUERY_KEYS.all, (old) =>
        old ? old.filter((d) => d.id !== id) : [],
      )
      return { previous }
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEYS.all, context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all })
    },
  })
}

export function useStarDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, starred }: { id: string; starred: boolean }) => starDocument(id, starred),
    onSuccess: (doc) => {
      queryClient.setQueryData(QUERY_KEYS.detail(doc.id), doc)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all })
    },
  })
}

export function useTrashDocuments(enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.trash,
    queryFn: listTrashedDocuments,
    enabled,
  })
}

export function useRestoreDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => restoreDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.trash })
    },
  })
}

export function usePermanentDeleteDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => permanentDeleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.trash })
    },
  })
}
