import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProjectListPage } from '@/pages/boq/ProjectListPage'
import { ProjectDashboardPage } from '@/pages/boq/ProjectDashboardPage'
import { ItemEditorPage } from '@/pages/boq/ItemEditorPage'

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <ProjectListPage /> },
      { path: '/projects/:projectId', element: <ProjectDashboardPage /> },
      { path: '/projects/:projectId/items/:itemId/edit', element: <ItemEditorPage /> },
    ],
  },
], { basename: import.meta.env.BASE_URL })

export default function App() {
  return <RouterProvider router={router} />
}
