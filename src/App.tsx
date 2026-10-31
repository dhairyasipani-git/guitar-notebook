import { HashRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { BackupPage } from './pages/BackupPage'
import { ClassPage } from './pages/ClassPage'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { TabEditorPage } from './pages/TabEditorPage'

// Hash routing keeps every page working on any static host without server rewrites.
export function App() {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="class/:classId" element={<ClassPage />} />
        <Route path="class/:classId/tab/:tabId" element={<TabEditorPage />} />
        <Route path="backup" element={<BackupPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
