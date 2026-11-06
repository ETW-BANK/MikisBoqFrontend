import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { MaterialsPage } from '@/pages/materials/MaterialsPage'
import { RateAnalysesListPage } from '@/pages/rate-analyses/RateAnalysesListPage'
import { RateAnalysisBuilderPage } from '@/pages/rate-analyses/RateAnalysisBuilderPage'
import { RateAnalysisDetailPage } from '@/pages/rate-analyses/RateAnalysisDetailPage'
import { ProjectsListPage } from '@/pages/projects/ProjectsListPage'
import { ProjectDetailPage } from '@/pages/projects/ProjectDetailPage'
import { BoqDetailPage } from '@/pages/projects/BoqDetailPage'

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/materials', element: <MaterialsPage /> },
          { path: '/rate-analyses', element: <RateAnalysesListPage /> },
          { path: '/rate-analyses/new', element: <RateAnalysisBuilderPage /> },
          { path: '/rate-analyses/:id', element: <RateAnalysisDetailPage /> },
          { path: '/projects', element: <ProjectsListPage /> },
          { path: '/projects/:id', element: <ProjectDetailPage /> },
          { path: '/projects/:projectId/boqs/:boqId', element: <BoqDetailPage /> },
        ],
      },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}