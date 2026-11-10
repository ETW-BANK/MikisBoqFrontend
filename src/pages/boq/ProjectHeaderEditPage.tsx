import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ErrorMessage } from '@/components/shared/ErrorMessage'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { getBoqProject, updateBoqProject } from '@/api/projects'
import type { UpdateBoqProjectRequest } from '@/api/projects'

const fieldClass = 'mt-1 h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand'

export function ProjectHeaderEditPage() {
  const { projectId = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [formError, setFormError] = useState<unknown>(null)
  const projectQuery = useQuery({
    queryKey: ['boqProject', projectId],
    queryFn: () => getBoqProject(projectId),
    enabled: Boolean(projectId),
  })
  const updateProject = useMutation({
    mutationFn: (payload: UpdateBoqProjectRequest) => updateBoqProject(projectId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['boqProjects'] }),
        queryClient.invalidateQueries({ queryKey: ['boqProject', projectId] }),
      ])
    },
  })

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    updateProject.reset()
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
      setFormError(new Error('Enter a project name and a valid non-negative contractor grade.'))
      return
    }

    try {
      await updateProject.mutateAsync(payload)
    } catch (error) {
      setFormError(error)
    }
  }

  return (
    <div className="space-y-6">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-brand hover:underline">
        <ArrowLeft className="h-4 w-4" /> All projects
      </Link>
      <div>
        <h1 className="text-2xl font-bold">Edit project header</h1>
        <p className="mt-1 text-sm text-gray-500">Update the project details and contractor information.</p>
      </div>
      {projectQuery.isLoading && <LoadingSpinner label="Loading project details..." />}
      {projectQuery.error && <ErrorMessage error={projectQuery.error} />}
      {formError !== null && <ErrorMessage error={formError} />}
      {updateProject.isSuccess && (
        <p role="status" className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Project details saved.
        </p>
      )}
      {projectQuery.data && (
        <Card className="p-6">
          <form
            key={projectQuery.data.id}
            onSubmit={(event) => void submit(event)}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <label className="text-sm font-medium">Project name *
              <input className={fieldClass} name="name" required maxLength={200} defaultValue={projectQuery.data.name} />
            </label>
            <label className="text-sm font-medium">Location
              <input className={fieldClass} name="location" defaultValue={projectQuery.data.location} />
            </label>
            <label className="text-sm font-medium">Client
              <input className={fieldClass} name="client" defaultValue={projectQuery.data.client} />
            </label>
            <label className="text-sm font-medium">Consultant
              <input className={fieldClass} name="consultant" defaultValue={projectQuery.data.consultant} />
            </label>
            <label className="text-sm font-medium">Contractor
              <input className={fieldClass} name="contractor" defaultValue={projectQuery.data.contractor} />
            </label>
            <label className="text-sm font-medium">Contractor grade
              <input className={fieldClass} name="contractorGrade" type="number" min="0" step="1" required defaultValue={projectQuery.data.contractorGrade} />
            </label>
            <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
              <Button type="submit" disabled={updateProject.isPending}>
                {updateProject.isPending ? 'Saving…' : 'Save changes'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/')}>Cancel</Button>
              <Button type="button" variant="outline" onClick={() => navigate(`/projects/${projectId}`)}>Edit Project</Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  )
}
