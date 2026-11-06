import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Plus, FolderOpen } from 'lucide-react'
import { useAddBoq, useProject } from '@/hooks/useProjects'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorMessage } from '@/components/shared/ErrorMessage'

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: project, isLoading, error } = useProject(id)
  const [showAddBoq, setShowAddBoq] = useState(false)

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />
  if (!project) return <ErrorMessage error="Project not found" />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/projects')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <p className="font-mono text-sm text-gray-500">{project.code}</p>
          </div>
        </div>
        <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
          {project.status}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Currency" value={project.currencyCode} />
        <Stat label="Overhead" value={`${project.overheadPercent}%`} />
        <Stat label="Profit" value={`${project.profitPercent}%`} />
        <Stat label="Contingency" value={`${project.contingencyPercent}%`} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Bill of Quantities</CardTitle>
          <Button size="sm" onClick={() => setShowAddBoq(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New BoQ
          </Button>
        </CardHeader>
        <CardContent>
          {project.boqs.length === 0 ? (
            <div className="py-8 text-center">
              <FolderOpen className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">No BoQs yet.</p>
              <Button className="mt-4" onClick={() => setShowAddBoq(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create your first BoQ
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {project.boqs.map((boq) => (
                <Link
                  key={boq.id}
                  to={`/projects/${project.id}/boqs/${boq.id}`}
                  className="block rounded-md border border-gray-200 p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{boq.title}</p>
                      <p className="text-sm text-gray-500">{boq.description || 'No description'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{boq.items.length} items</p>
                      <p className="font-mono text-lg font-semibold">
                        {boq.total.amount.toFixed(2)} {boq.total.currencyCode}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddBoqDialog
        open={showAddBoq}
        onClose={() => setShowAddBoq(false)}
        projectId={project.id}
      />
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs uppercase text-gray-500">{label}</p>
        <p className="mt-1 text-lg font-semibold">{value}</p>
      </CardContent>
    </Card>
  )
}

function AddBoqDialog({
  open,
  onClose,
  projectId,
}: {
  open: boolean
  onClose: () => void
  projectId: string
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const mutation = useAddBoq()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!title.trim()) return setError('Title is required')
    try {
      await mutation.mutateAsync({
        projectId,
        payload: { title: title.trim(), description: description.trim() },
      })
      setTitle('')
      setDescription('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add BoQ')
    }
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent onClose={onClose}>
        <h2 className="mb-4 text-xl font-bold">New BoQ</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Civil Works" />
          </div>
          <div>
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
          </div>
          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Creating...' : 'Create BoQ'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}