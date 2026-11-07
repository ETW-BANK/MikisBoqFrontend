import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Plus, FolderOpen, Pencil, Trash2 } from 'lucide-react'
import { useAddBoq, useDeleteBoq, useDeleteProject, useProject, useUpdateBoq } from '@/hooks/useProjects'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorMessage } from '@/components/shared/ErrorMessage'
import { CreateProjectDialog } from './CreateProjectDialog'

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: project, isLoading, error } = useProject(id)
  const [showAddBoq, setShowAddBoq] = useState(false)
  const [editingBoq, setEditingBoq] = useState<{ id: string; title: string; description: string } | null>(null)
  const [editProject, setEditProject] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const deleteProject = useDeleteProject()
  const deleteBoq = useDeleteBoq()

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />
  if (!project) return <ErrorMessage error="Project not found" />

  const handleDeleteProject = async () => {
    if (!window.confirm(`Delete project "${project.name}" and its BOQs?`)) return
    try {
      await deleteProject.mutateAsync(project.id)
      navigate('/projects')
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete project')
    }
  }

  const handleDeleteBoq = async (boqId: string, title: string) => {
    if (!window.confirm(`Delete BoQ "${title}"?`)) return
    setActionError(null)
    try {
      await deleteBoq.mutateAsync({ projectId: project.id, boqId })
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete BoQ')
    }
  }

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
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
            {project.status}
          </span>
          <Button size="sm" variant="outline" onClick={() => setEditProject(true)}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Button>
          <Button size="sm" variant="destructive" onClick={handleDeleteProject} disabled={deleteProject.isPending}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      {actionError && <ErrorMessage error={actionError} />}

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
                <div key={boq.id} className="flex items-center justify-between gap-3 rounded-md border border-gray-200 p-4 hover:bg-gray-50">
                  <Link to={`/projects/${project.id}/boqs/${boq.id}`} className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium">{boq.title}</p>
                        <p className="truncate text-sm text-gray-500">{boq.description || 'No description'}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs text-gray-500">{boq.items.length} items</p>
                        <p className="font-mono text-lg font-semibold">
                          {boq.total.amount.toFixed(2)} {boq.total.currencyCode}
                        </p>
                      </div>
                    </div>
                  </Link>
                  <Button size="icon" variant="ghost" aria-label={`Edit ${boq.title}`} onClick={() => setEditingBoq({ id: boq.id, title: boq.title, description: boq.description })}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" aria-label={`Delete ${boq.title}`} disabled={deleteBoq.isPending} onClick={() => void handleDeleteBoq(boq.id, boq.title)}>
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
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
      {editProject && <CreateProjectDialog open={editProject} onClose={() => setEditProject(false)} project={project} />}
      {editingBoq && (
        <AddBoqDialog
          open
          onClose={() => setEditingBoq(null)}
          projectId={project.id}
          boq={editingBoq}
        />
      )}
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
  boq,
}: {
  open: boolean
  onClose: () => void
  projectId: string
  boq?: { id: string; title: string; description: string }
}) {
  const [title, setTitle] = useState(boq?.title ?? '')
  const [description, setDescription] = useState(boq?.description ?? '')
  const [error, setError] = useState<string | null>(null)
  const create = useAddBoq()
  const update = useUpdateBoq()
  const mutation = boq ? update : create

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!title.trim()) return setError('Title is required')
    try {
      const payload = { title: title.trim(), description: description.trim() }
      if (boq) await update.mutateAsync({ projectId, boqId: boq.id, payload })
      else await create.mutateAsync({ projectId, payload })
      setTitle('')
      setDescription('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${boq ? 'update' : 'add'} BoQ`)
    }
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent onClose={onClose}>
        <h2 className="mb-4 text-xl font-bold">{boq ? 'Edit BoQ' : 'New BoQ'}</h2>
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
              {mutation.isPending ? 'Saving...' : boq ? 'Save Changes' : 'Create BoQ'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}