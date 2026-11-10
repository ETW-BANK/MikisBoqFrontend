import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ErrorMessage } from '@/components/shared/ErrorMessage'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import {
  createBoqProject,
  deleteBoqProject,
  getBoqProject,
  listBoqProjects,
  updateBoqProject,
} from '@/api/projects'
import type { BoqProject, UpdateBoqProjectRequest } from '@/api/projects'
import { formatMoney } from './boqFormat'

const fieldClass = 'mt-1 h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand'

export function ProjectListPage() {
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState<unknown>(null)
  const [projectActionError, setProjectActionError] = useState<unknown>(null)
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const projectsQuery = useQuery({
    queryKey: ['boqProjects'],
    queryFn: listBoqProjects,
  })
  const editingProjectQuery = useQuery({
    queryKey: ['boqProject', editingProjectId],
    queryFn: () => getBoqProject(editingProjectId!),
    enabled: editingProjectId !== null,
  })
  const createProject = useMutation({
    mutationFn: createBoqProject,
    onSuccess: async (projectId) => {
      await queryClient.invalidateQueries({ queryKey: ['boqProjects'] })
      navigate(`/projects/${projectId}`)
    },
  })
  const updateProject = useMutation({
    mutationFn: ({ projectId, payload }: { projectId: string; payload: UpdateBoqProjectRequest }) =>
      updateBoqProject(projectId, payload),
    onSuccess: async (_result, { projectId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['boqProjects'] }),
        queryClient.invalidateQueries({ queryKey: ['boqProject', projectId] }),
      ])
      setEditingProjectId(null)
    },
  })
  const deleteProject = useMutation({
    mutationFn: deleteBoqProject,
    onSuccess: async (_result, projectId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['boqProjects'] }),
        queryClient.removeQueries({ queryKey: ['boqProject', projectId] }),
        queryClient.removeQueries({ queryKey: ['boqProjectItems', projectId] }),
        queryClient.removeQueries({ queryKey: ['boqProjectSummary', projectId] }),
      ])
    },
  })

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    const formData = new FormData(event.currentTarget)
    const payload = {
      name: String(formData.get('name') ?? '').trim(),
      location: String(formData.get('location') ?? '').trim(),
      client: String(formData.get('client') ?? '').trim(),
      consultant: String(formData.get('consultant') ?? '').trim(),
      contractor: String(formData.get('contractor') ?? '').trim(),
      contractorGrade: Number(formData.get('contractorGrade')),
    }
    if (!payload.name || !Number.isFinite(payload.contractorGrade)) {
      setFormError(new Error('Enter a project name and a valid contractor grade.'))
      return
    }
    try {
      await createProject.mutateAsync(payload)
    } catch (error) {
      setFormError(error)
    }
  }

  async function submitProjectEdit(event: React.FormEvent<HTMLFormElement>, projectId: string) {
    event.preventDefault()
    setProjectActionError(null)
    const formData = new FormData(event.currentTarget)
    const contractorGrade = Number(formData.get('contractorGrade'))
    const payload: UpdateBoqProjectRequest = {
      name: String(formData.get('name') ?? '').trim(),
      location: String(formData.get('location') ?? '').trim(),
      client: String(formData.get('client') ?? '').trim(),
      consultant: String(formData.get('consultant') ?? '').trim(),
      contractor: String(formData.get('contractor') ?? '').trim(),
      contractorGrade,
    }
    if (!payload.name || !Number.isFinite(contractorGrade) || contractorGrade < 0) {
      setProjectActionError(new Error('Enter a project name and a valid non-negative contractor grade.'))
      return
    }
    try {
      await updateProject.mutateAsync({ projectId, payload })
    } catch (error) {
      setProjectActionError(error)
    }
  }

  async function confirmDelete(project: BoqProject) {
    const confirmed = window.confirm(
      `Delete "${project.name}" and its ${project.itemCount} BOQ item${project.itemCount === 1 ? '' : 's'}? This cannot be undone.`
    )
    if (!confirmed) return
    setProjectActionError(null)
    try {
      await deleteProject.mutateAsync(project.id)
    } catch (error) {
      setProjectActionError(error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="mt-1 text-sm text-gray-500">Choose a project to review and edit its BOQ.</p>
        </div>
        <Button onClick={() => setCreating((value) => !value)}>
          <Plus className="mr-2 h-4 w-4" />
          {creating ? 'Close form' : 'New Project'}
        </Button>
      </div>

      {creating && (
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Create project</h2>
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm font-medium">Project name *
              <input className={fieldClass} name="name" required maxLength={200} />
            </label>
            <label className="text-sm font-medium">Location
              <input className={fieldClass} name="location" />
            </label>
            <label className="text-sm font-medium">Client
              <input className={fieldClass} name="client" />
            </label>
            <label className="text-sm font-medium">Consultant
              <input className={fieldClass} name="consultant" />
            </label>
            <label className="text-sm font-medium">Contractor
              <input className={fieldClass} name="contractor" />
            </label>
            <label className="text-sm font-medium">Contractor grade
              <input className={fieldClass} name="contractorGrade" type="number" min="0" step="1" defaultValue="1" />
            </label>
            {formError !== null ? <div className="sm:col-span-2 lg:col-span-3"><ErrorMessage error={formError} /></div> : null}
            <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
              <Button type="submit" disabled={createProject.isPending}>
                {createProject.isPending ? 'Creating…' : 'Create project'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {editingProjectId && (
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Edit project</h2>
            <Button type="button" variant="outline" size="sm" onClick={() => setEditingProjectId(null)}>Close</Button>
          </div>
          {editingProjectQuery.isLoading && <LoadingSpinner label="Loading project details..." />}
          {editingProjectQuery.error && <ErrorMessage error={editingProjectQuery.error} />}
          {editingProjectQuery.data && (
            <ProjectEditForm
              project={editingProjectQuery.data}
              isSaving={updateProject.isPending}
              error={projectActionError}
              onCancel={() => setEditingProjectId(null)}
              onSubmit={(event) => void submitProjectEdit(event, editingProjectQuery.data.id)}
            />
          )}
        </Card>
      )}
      {projectActionError !== null && !editingProjectId ? <ErrorMessage error={projectActionError} /> : null}

      {projectsQuery.isLoading && <LoadingSpinner label="Loading projects..." />}
      {projectsQuery.error && <ErrorMessage error={projectsQuery.error} />}
      {projectsQuery.data && (
        projectsQuery.data.length === 0 ? (
          <Card className="p-12 text-center text-sm text-gray-500">No projects yet. Create your first project to get started.</Card>
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead className="border-b bg-gray-50">
                <tr>
                  {['Project', 'Location', 'Client', 'BOQ items', 'Direct cost', 'Actions'].map((heading) => (
                    <th key={heading} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {projectsQuery.data.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <Link className="font-medium text-brand hover:underline" to={`/projects/${project.id}`}>{project.name}</Link>
                      <p className="mt-1 text-xs text-gray-500">Contractor grade {project.contractorGrade}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{project.location || '—'}</td>
                    <td className="px-5 py-4 text-sm text-gray-600">{project.client || '—'}</td>
                    <td className="px-5 py-4 text-sm text-gray-600">{project.itemCount}</td>
                    <td className="px-5 py-4 text-sm font-medium">{formatMoney(project.totalDirectCost, project.currencyCode)}</td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mr-2"
                        disabled={deleteProject.isPending}
                        onClick={() => {
                          setProjectActionError(null)
                          setEditingProjectId(project.id)
                        }}
                      >
                        <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={deleteProject.isPending}
                        onClick={() => void confirmDelete(project)}
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        {deleteProject.isPending ? 'Deleting…' : 'Delete'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )
      )}
    </div>
  )
}

function ProjectEditForm({
  project,
  isSaving,
  error,
  onCancel,
  onSubmit,
}: {
  project: BoqProject
  isSaving: boolean
  error: unknown
  onCancel: () => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
}) {
  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <label className="text-sm font-medium">Project name *
        <input className={fieldClass} name="name" required maxLength={200} defaultValue={project.name} />
      </label>
      <label className="text-sm font-medium">Location
        <input className={fieldClass} name="location" defaultValue={project.location} />
      </label>
      <label className="text-sm font-medium">Client
        <input className={fieldClass} name="client" defaultValue={project.client} />
      </label>
      <label className="text-sm font-medium">Consultant
        <input className={fieldClass} name="consultant" defaultValue={project.consultant} />
      </label>
      <label className="text-sm font-medium">Contractor
        <input className={fieldClass} name="contractor" defaultValue={project.contractor} />
      </label>
      <label className="text-sm font-medium">Contractor grade
        <input className={fieldClass} name="contractorGrade" type="number" min="0" step="1" required defaultValue={project.contractorGrade} />
      </label>
      {error !== null ? <div className="sm:col-span-2 lg:col-span-3"><ErrorMessage error={error} /></div> : null}
      <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
        <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save changes'}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}
