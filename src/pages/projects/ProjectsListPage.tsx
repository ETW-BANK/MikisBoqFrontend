import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useProjects } from '@/hooks/useProjects'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorMessage } from '@/components/shared/ErrorMessage'
import { CreateProjectDialog } from './CreateProjectDialog'

export function ProjectsListPage() {
  const { data: projects = [], isLoading, error } = useProjects()
  const [showCreate, setShowCreate] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-sm text-gray-500">Manage your construction projects</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {isLoading && <LoadingSpinner label="Loading projects..." />}
      {error && <ErrorMessage error={error} />}

      {!isLoading && !error && (
        <Card>
          {projects.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">No projects yet.</p>
              <Button className="mt-4" onClick={() => setShowCreate(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create your first project
              </Button>
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">BoQs</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {projects.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-mono text-sm">
                        <Link to={`/projects/${p.id}`} className="text-brand hover:underline">
                          {p.code}
                        </Link>
                      </td>
                      <td className="px-6 py-4 font-medium">{p.name}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-600">{p.boqs.length}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(p.createdAtUtc).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t border-gray-200 px-6 py-3 text-xs text-gray-500">
                {projects.length} projects
              </div>
            </div>
          )}
        </Card>
      )}

      {showCreate && <CreateProjectDialog open onClose={() => setShowCreate(false)} />}
    </div>
  )
}