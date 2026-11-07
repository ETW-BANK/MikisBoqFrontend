import { useState } from 'react'
import { useCreateProject, useUpdateProject } from '@/hooks/useProjects'
import type { CreateProjectRequest, ProjectDto } from '@/api/projects'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { getApiErrorMessage } from '@/lib/apiErrors'

const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const emptyValues: CreateProjectRequest = {
  code: '',
  name: '',
  clientId: '',
  currencyCode: 'ETB',
  overheadPercent: 10,
  profitPercent: 5,
  contingencyPercent: 2,
  ownerId: '',
  location: '',
  client: '',
  consultant: '',
  contractor: '',
}

export function CreateProjectDialog({
  open,
  onClose,
  project,
}: {
  open: boolean
  onClose: () => void
  project?: ProjectDto
}) {
  const [values, setValues] = useState<CreateProjectRequest>(() => project ? {
    code: project.code,
    name: project.name,
    clientId: project.clientId,
    currencyCode: project.currencyCode,
    overheadPercent: project.overheadPercent,
    profitPercent: project.profitPercent,
    contingencyPercent: project.contingencyPercent,
    ownerId: project.ownerId,
    location: project.location ?? '',
    client: project.client ?? '',
    consultant: project.consultant ?? '',
    contractor: project.contractor ?? '',
  } : { ...emptyValues })
  const [error, setError] = useState<string | null>(null)
  const create = useCreateProject()
  const update = useUpdateProject()
  const mutation = project ? update : create

  const setField = <K extends keyof CreateProjectRequest>(key: K, value: CreateProjectRequest[K]) => {
    setValues((current) => ({ ...current, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!values.name.trim()) return setError('Name is required')
    if (!values.clientId.trim()) return setError('Client ID is required')
    if (!GUID_PATTERN.test(values.clientId.trim())) return setError('Client ID must be a valid UUID.')
    if (!project && !values.ownerId.trim()) return setError('Owner ID is required')
    if (!project && !GUID_PATTERN.test(values.ownerId.trim())) return setError('Owner ID must be a valid UUID.')
    if (!values.currencyCode.trim()) return setError('Currency is required')

    const payload: CreateProjectRequest = {
      ...values,
      code: values.code?.trim() || undefined,
      name: values.name.trim(),
      clientId: values.clientId.trim(),
      currencyCode: values.currencyCode.trim().toUpperCase(),
      ownerId: values.ownerId.trim(),
      location: values.location.trim(),
      client: values.client.trim(),
      consultant: values.consultant.trim(),
      contractor: values.contractor.trim(),
    }

    try {
      if (project) {
        const updatePayload = {
          code: payload.code,
          name: payload.name,
          clientId: payload.clientId,
          currencyCode: payload.currencyCode,
          overheadPercent: payload.overheadPercent,
          profitPercent: payload.profitPercent,
          contingencyPercent: payload.contingencyPercent,
          location: payload.location,
          client: payload.client,
          consultant: payload.consultant,
          contractor: payload.contractor,
        }
        await update.mutateAsync({ id: project.id, payload: updatePayload })
      } else {
        await create.mutateAsync(payload)
        setValues({ ...emptyValues })
      }
      onClose()
    } catch (err) {
      setError(getApiErrorMessage(err, `Failed to ${project ? 'update' : 'create'} project`))
    }
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent onClose={onClose} className="max-h-[90vh] overflow-y-auto">
        <h2 className="mb-4 text-xl font-bold">{project ? 'Edit Project' : 'New Project'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Code (optional)">
              <Input value={values.code ?? ''} onChange={(e) => setField('code', e.target.value)} placeholder="Generated if blank" />
            </Field>
            <Field label="Name *">
              <Input value={values.name} onChange={(e) => setField('name', e.target.value)} required />
            </Field>
            <Field label="Client ID *">
              <Input value={values.clientId} onChange={(e) => setField('clientId', e.target.value)} placeholder="UUID from the API" required />
            </Field>
            <Field label="Currency *">
              <Input value={values.currencyCode} onChange={(e) => setField('currencyCode', e.target.value)} placeholder="ETB" required />
            </Field>
            {!project && <Field label="Owner ID *">
              <Input value={values.ownerId} onChange={(e) => setField('ownerId', e.target.value)} placeholder="UUID from the API" required />
            </Field>}
            <Field label="Location">
              <Input value={values.location} onChange={(e) => setField('location', e.target.value)} />
            </Field>
            <Field label="Client">
              <Input value={values.client} onChange={(e) => setField('client', e.target.value)} />
            </Field>
            <Field label="Consultant">
              <Input value={values.consultant} onChange={(e) => setField('consultant', e.target.value)} />
            </Field>
            <Field label="Contractor">
              <Input value={values.contractor} onChange={(e) => setField('contractor', e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Overhead %">
              <Input type="number" step="0.01" value={values.overheadPercent} onChange={(e) => setField('overheadPercent', Number(e.target.value))} />
            </Field>
            <Field label="Profit %">
              <Input type="number" step="0.01" value={values.profitPercent} onChange={(e) => setField('profitPercent', Number(e.target.value))} />
            </Field>
            <Field label="Contingency %">
              <Input type="number" step="0.01" value={values.contingencyPercent} onChange={(e) => setField('contingencyPercent', Number(e.target.value))} />
            </Field>
          </div>
          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : project ? 'Save Changes' : 'Create Project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label>{label}</Label>{children}</div>
}
