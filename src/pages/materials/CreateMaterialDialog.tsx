import { useState } from 'react'
import { useCreateMaterial } from '@/hooks/useMaterials'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent } from '@/components/ui/dialog'

const UNIT_OPTIONS = [
  { code: 'EA', label: 'Each' },
  { code: 'M3', label: 'Cubic Meter' },
  { code: 'M2', label: 'Square Meter' },
  { code: 'LM', label: 'Linear Meter' },
  { code: 'KG', label: 'Kilogram' },
  { code: 'TON', label: 'Tonne' },
  { code: 'HR', label: 'Hour' },
  { code: 'DAY', label: 'Day' },
  { code: 'LS', label: 'Lump Sum' },
]

export function CreateMaterialDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [unitCode, setUnitCode] = useState('M3')
  const [rateAmount, setRateAmount] = useState('0')
  const [currencyCode, setCurrencyCode] = useState('USD')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mutation = useCreateMaterial()

  const reset = () => {
    setName('')
    setDescription('')
    setUnitCode('M3')
    setRateAmount('0')
    setCurrencyCode('USD')
    setCode('')
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Name is required')
      return
    }

    const rate = parseFloat(rateAmount)
    if (isNaN(rate) || rate < 0) {
      setError('Rate must be a non-negative number')
      return
    }

    try {
      await mutation.mutateAsync({
        code: code.trim() || undefined,
        name: name.trim(),
        description: description.trim() || undefined,
        unitCode,
        rateAmount: rate,
        currencyCode,
      })
      reset()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create material')
    }
  }

  const handleClose = () => {
    if (!mutation.isPending) {
      reset()
      onClose()
    }
  }

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogContent onClose={handleClose}>
        <h2 className="mb-4 text-xl font-bold">New Material</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="mat-name">Name *</Label>
            <Input
              id="mat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Portland Cement Type I"
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="mat-desc">Description (optional)</Label>
            <Input
              id="mat-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., 50kg bags, grade 42.5"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mat-unit">Unit *</Label>
              <select
                id="mat-unit"
                value={unitCode}
                onChange={(e) => setUnitCode(e.target.value)}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              >
                {UNIT_OPTIONS.map((u) => (
                  <option key={u.code} value={u.code}>
                    {u.code} — {u.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="mat-rate">Rate *</Label>
              <Input
                id="mat-rate"
                type="number"
                step="0.01"
                min="0"
                value={rateAmount}
                onChange={(e) => setRateAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mat-code">Code (optional)</Label>
              <Input
                id="mat-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Leave blank to auto-generate"
              />
              <p className="mt-1 text-xs text-gray-500">e.g., MAT-0005 (auto if blank)</p>
            </div>

            <div>
              <Label htmlFor="mat-currency">Currency</Label>
              <select
                id="mat-currency"
                value={currencyCode}
                onChange={(e) => setCurrencyCode(e.target.value)}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="TRY">TRY</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Creating...' : 'Create Material'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}