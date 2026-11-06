import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { PlaceholderPage } from '@/pages/PlaceholderPage'
import { MaterialsPage } from '@/pages/materials/MaterialsPage'

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/materials', element: <MaterialsPage /> },
          {
            path: '/rate-analyses',
            element: <PlaceholderPage title="Rate Analyses" phase="D5" />,
          },
          {
            path: '/projects',
            element: <PlaceholderPage title="Projects" phase="D6" />,
          },
        ],
      },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}