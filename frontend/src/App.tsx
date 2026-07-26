import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/auth/AuthContext";
import { ProtectedRoute } from "@/auth/ProtectedRoute";
import { LoginPage } from "@/pages/LoginPage";
import { SignupPage } from "@/pages/SignupPage";
import { NotebooksPage } from "@/pages/NotebooksPage";
import { NotebookPage } from "@/pages/NotebookPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route
            path="/notebooks"
            element={
              <ProtectedRoute>
                <NotebooksPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notebooks/:notebookId"
            element={
              <ProtectedRoute>
                <NotebookPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/notebooks" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
