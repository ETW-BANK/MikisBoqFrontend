import { useState } from 'react'
import { useCreateProject } from '@/hooks/useProjects'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useAuthStore } from '@/stores/authStore'

export function CreateProjectDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const user = useAuthStore((s) => s.user)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [clientId, setClientId] = useState('3fa85f64-5717-4562-b3fc-2c963f66afa6')
  const [overhead, setOverhead] = useState('10')
  const [profit, setProfit] = useState('5')
  const [contingency, setContingency] = useState('2')
  const [error, setError] = useState<string | null>(null)

  const mutation = useCreateProject()

  const reset = () => {
    setCode('')
    setName('')
    setClientId('3fa85f64-5717-4562-b3fc-2c963f66afa6')
    setOverhead('10')
    setProfit('5')
    setContingency('2')
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!code.trim()) return setError('Code is required')
    if (!name.trim()) return setError('Name is required')

    try {
      await mutation.mutateAsync({
        code: code.trim(),
        name: name.trim(),
        clientId,
       currencyCode: 'ETB',
        overheadPercent: parseFloat(overhead) || 0,
        profitPercent: parseFloat(profit) || 0,
        contingencyPercent: parseFloat(contingency) || 0,
        ownerId: '00000000-0000-0000-0000-000000000001',
      })
      reset()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
    }
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent onClose={onClose}>
        <h2 className="mb-4 text-xl font-bold">New Project</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Code *</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g., PRJ-2026-001" />
          </div>
          <div>
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Dino Tower Construction" />
          </div>
          <div>
            <Label>Client ID</Label>
            <Input value={clientId} onChange={(e) => setClientId(e.target.value)} className="font-mono text-xs" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label>Overhead %</Label>
              <Input type="number" step="0.01" value={overhead} onChange={(e) => setOverhead(e.target.value)} />
            </div>
            <div>
              <Label>Profit %</Label>
              <Input type="number" step="0.01" value={profit} onChange={(e) => setProfit(e.target.value)} />
            </div>
            <div>
              <Label>Contingency %</Label>
              <Input type="number" step="0.01" value={contingency} onChange={(e) => setContingency(e.target.value)} />
            </div>
          </div>

          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}