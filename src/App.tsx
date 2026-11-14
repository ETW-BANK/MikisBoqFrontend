import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProjectListPage } from '@/pages/boq/ProjectListPage'
import { ProjectDashboardPage } from '@/pages/boq/ProjectDashboardPage'
import { ProjectHeaderEditPage } from '@/pages/boq/ProjectHeaderEditPage'
import { ItemEditorPage } from '@/pages/boq/ItemEditorPage'
import { RateAnalysesListPage } from '@/pages/rate-analyses/RateAnalysesListPage'
import { RateAnalysisDetailPage } from '@/pages/rate-analyses/RateAnalysisDetailPage'
import { RateAnalysisBuilderPage } from '@/pages/rate-analyses/RateAnalysisBuilderPage'

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <ProjectListPage /> },
      { path: '/projects/:projectId', element: <ProjectDashboardPage /> },
      { path: '/projects/:projectId/edit', element: <ProjectHeaderEditPage /> },
      { path: '/projects/:projectId/items/:itemId/edit', element: <ItemEditorPage /> },
      { path: '/rate-analyses', element: <RateAnalysesListPage /> },
      { path: '/rate-analyses/new', element: <RateAnalysisBuilderPage /> },
      { path: '/rate-analyses/:id', element: <RateAnalysisDetailPage /> },
      { path: '/rate-analyses/:id/edit', element: <RateAnalysisBuilderPage /> },
    ],
  },
], { basename: import.meta.env.BASE_URL })

export default function App() {
  return <RouterProvider router={router} />
}
