import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { PageLoader } from '@/components/ui/Spinner'
import { AppShell } from '@/layouts/AppShell'
import { MainLayout } from '@/layouts/MainLayout'

import { HomePage }            from '@/pages/HomePage'
import { LoginPage }           from '@/pages/auth/LoginPage'
import { SignupPage }          from '@/pages/auth/SignupPage'
import { ForgotPasswordPage }  from '@/pages/auth/ForgotPasswordPage'
import { DashboardPage }       from '@/pages/dashboard/DashboardPage'
import { PredictionPage }      from '@/pages/prediction/PredictionPage'
import { ResultsPage }         from '@/pages/prediction/ResultsPage'
import { ChatPage }            from '@/pages/chat/ChatPage'
import { SuggestionsPage }     from '@/pages/SuggestionsPage'
import { AnalyzePage }         from '@/pages/AnalyzePage'
import { ReportsPage }         from '@/pages/ReportsPage'
import { ProfilePage }           from '@/pages/ProfileSettingsPage'
import { SettingsPage }          from '@/pages/SettingsPage'
import { NotFoundPage }          from '@/pages/NotFoundPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (user) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public pages with Navbar/Footer */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
      </Route>

      {/* Auth pages (no layout wrapper) */}
      <Route path="/login"           element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/signup"          element={<PublicRoute><SignupPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />

      {/* Authenticated app — AppShell with sidebar */}
      <Route element={<PrivateRoute><AppShell /></PrivateRoute>}>
        <Route path="/dashboard"   element={<DashboardPage />} />
        <Route path="/predict"     element={<PredictionPage />} />
        <Route path="/results/:id" element={<ResultsPage />} />
        <Route path="/chat"        element={<ChatPage />} />
        <Route path="/suggestions" element={<SuggestionsPage />} />
        <Route path="/analyze"     element={<AnalyzePage />} />
        <Route path="/reports"     element={<ReportsPage />} />
        <Route path="/profile"     element={<ProfilePage />} />
        <Route path="/settings"    element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
