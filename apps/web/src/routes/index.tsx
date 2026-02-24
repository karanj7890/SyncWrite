import { Routes, Route, Navigate } from 'react-router-dom'
import { DocumentListPage } from '../pages/DocumentListPage'
import { EditorPage } from '../pages/EditorPage'
import { LoginPage } from '../pages/LoginPage'
import { RegisterPage } from '../pages/RegisterPage'
import { ProtectedRoute } from './ProtectedRoute'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Navigate to="/documents" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/documents"
        element={
          <ProtectedRoute>
            <DocumentListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/documents/:id"
        element={
          <ProtectedRoute>
            <EditorPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
