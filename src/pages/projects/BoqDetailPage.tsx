import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, FileSpreadsheet, FileText, Pencil, Plus, Trash2 } from 'lucide-react'
import { useProject, useGenerateBoqReport } from '@/hooks/useProjects'
import {
  useAddManualBoqItem,
  useAddBoqItemFromRateAnalysis,
  useDeleteBoqItem,
  useUpdateBoqItem,
} from '@/hooks/useBoqItems'
import { useRateAnalyses } from '@/hooks/useRateAnalyses'
import type { BoqItemDto } from '@/api/projects'
import type { ManualBoqItemRequest } from '@/api/boqs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorMessage } from '@/components/shared/ErrorMessage'

export function BoqDetailPage() {
  const { projectId, boqId } = useParams<{ projectId: string; boqId: string }>()
  const navigate = useNavigate()
  const { data: project, isLoading, error } = useProject(projectId)
  const generate = useGenerateBoqReport()
  const [addMode, setAddMode] = useState<'analysis' | 'manual' | null>(null)
  const [editingItem, setEditingItem] = useState<BoqItemDto | null>(null)
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const deleteItem = useDeleteBoqItem()

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />
  if (!project) return <ErrorMessage error="Project not found" />

  const boq = project.boqs.find((b) => b.id === boqId)
  if (!boq) return <ErrorMessage error="BoQ not found" />

  const handleDownload = async (format: 'pdf' | 'excel') => {
    setBanner(null)
    try {
      await generate.mutateAsync({ projectId: project.id, boqId: boq.id, format })
      setBanner({ type: 'success', text: `BOQ ${format.toUpperCase()} downloaded.` })
    } catch (err) {
      setBanner({ type: 'error', text: err instanceof Error ? err.message : 'Failed to download the BOQ.' })
    }
  }

  const handleDeleteItem = async (item: BoqItemDto) => {
    if (!window.confirm(`Delete BOQ item "${item.itemCode}"?`)) return
    setBanner(null)
    try {
      await deleteItem.mutateAsync({ projectId: project.id, boqId: boq.id, itemId: item.id })
    } catch (err) {
      setBanner({ type: 'error', text: err instanceof Error ? err.message : 'Failed to delete BOQ item.' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/projects/${project.id}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{boq.title}</h1>
            <p className="text-sm text-gray-500">{boq.description || 'No description'}</p>
            <p className="text-xs text-gray-500">{project.name} · Amounts before VAT</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void handleDownload('pdf')} disabled={generate.isPending || boq.items.length === 0}>
            <FileText className="mr-2 h-4 w-4" /> PDF
          </Button>
          <Button variant="outline" onClick={() => void handleDownload('excel')} disabled={generate.isPending || boq.items.length === 0}>
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
          </Button>
        </div>
      </div>

      {banner && (
        <div className={`rounded-md p-3 text-sm ${banner.type === 'error' ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
          {banner.text}
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Line Items</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setAddMode('manual')}>
              <Plus className="mr-2 h-4 w-4" /> Manual Item
            </Button>
            <Button size="sm" onClick={() => setAddMode('analysis')}>
              <Plus className="mr-2 h-4 w-4" /> From Rate Analysis
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {boq.items.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">No items yet. Add a manual item or use a rate analysis.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="pb-2 text-left text-xs font-medium uppercase text-gray-500">Item Code</th>
                    <th className="pb-2 text-left text-xs font-medium uppercase text-gray-500">Description</th>
                    <th className="pb-2 text-left text-xs font-medium uppercase text-gray-500">Unit</th>
                    <th className="pb-2 text-right text-xs font-medium uppercase text-gray-500">Qty</th>
                    <th className="pb-2 text-right text-xs font-medium uppercase text-gray-500">Rate</th>
                    <th className="pb-2 text-right text-xs font-medium uppercase text-gray-500">Total</th>
                    <th className="pb-2 text-right text-xs font-medium uppercase text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {boq.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2 font-mono">{item.itemCode}</td>
                      <td className="py-2">{item.description}</td>
                      <td className="py-2">{item.unitCode}</td>
                      <td className="py-2 text-right font-mono">{item.quantity}</td>
                      <td className="py-2 text-right font-mono">{item.rate.amount.toFixed(2)}</td>
                      <td className="py-2 text-right font-mono font-semibold">{item.total.amount.toFixed(2)}</td>
                      <td className="py-2 text-right">
                        <Button size="icon" variant="ghost" aria-label={`Edit ${item.itemCode}`} onClick={() => setEditingItem(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" aria-label={`Delete ${item.itemCode}`} disabled={deleteItem.isPending} onClick={() => void handleDeleteItem(item)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-gray-300">
                  <tr>
                    <td colSpan={5} className="pt-2 text-right font-semibold">Total:</td>
                    <td colSpan={2} className="pt-2 text-right font-mono font-bold text-brand">
                      {boq.total.amount.toFixed(2)} {project.currencyCode}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {addMode === 'analysis' && (
        <AddItemFromAnalysisDialog
          open
          onClose={() => setAddMode(null)}
          projectId={project.id}
          boqId={boq.id}
        />
      )}
      {addMode === 'manual' && (
        <BoqItemDialog
          open
          onClose={() => setAddMode(null)}
          projectId={project.id}
          boqId={boq.id}
          currencyCode={project.currencyCode}
        />
      )}
      {editingItem && (
        <BoqItemDialog
          open
          onClose={() => setEditingItem(null)}
          projectId={project.id}
          boqId={boq.id}
          currencyCode={project.currencyCode}
          item={editingItem}
        />
      )}
    </div>
  )
}

function AddItemFromAnalysisDialog({
  open,
  onClose,
  projectId,
  boqId,
}: {
  open: boolean
  onClose: () => void
  projectId: string
  boqId: string
}) {
  const { data: rates = [], isLoading, error: ratesError } = useRateAnalyses()
  const eligibleRates = rates.filter((rate) =>
    !rate.linkedProjectId || rate.linkedProjectId.toLowerCase() === projectId.toLowerCase()
  )
  const hasRatesForOtherProjects = rates.some((rate) =>
    rate.linkedProjectId && rate.linkedProjectId.toLowerCase() !== projectId.toLowerCase()
  )
  const [rateAnalysisId, setRateAnalysisId] = useState('')
  const [itemCode, setItemCode] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [error, setError] = useState<string | null>(null)
  const mutation = useAddBoqItemFromRateAnalysis()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!rateAnalysisId) return setError('Select a Rate Analysis')
    if (!itemCode.trim()) return setError('Item Code is required')
    const qty = Number(quantity)
    if (!Number.isFinite(qty) || qty <= 0) return setError('Quantity must be greater than zero')
    try {
      await mutation.mutateAsync({
        projectId,
        boqId,
        payload: { rateAnalysisId, itemCode: itemCode.trim(), quantity: qty },
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item')
    }
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent onClose={onClose}>
        <h2 className="mb-4 text-xl font-bold">Add from Rate Analysis</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Rate Analysis *</Label>
            <select value={rateAnalysisId} onChange={(e) => setRateAnalysisId(e.target.value)} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
              <option value="">-- Select --</option>
              {rates.map((rate) => {
                const linkedElsewhere = !!rate.linkedProjectId &&
                  rate.linkedProjectId.toLowerCase() !== projectId.toLowerCase()
                return (
                <option key={rate.id} value={rate.id} disabled={linkedElsewhere}>
                  {rate.code} — {rate.description} ({rate.totalUnitRate.amount.toFixed(2)} {rate.totalUnitRate.currencyCode}/{rate.unitCode})
                  {linkedElsewhere ? ` — linked to project ${rate.linkedProjectId}` : ''}
                </option>
                )
              })}
            </select>
          </div>
          {isLoading && <p className="text-sm text-gray-500">Loading rate analyses...</p>}
          {ratesError && <ErrorMessage error={ratesError} />}
          {!isLoading && !ratesError && eligibleRates.length === 0 && rates.length === 0 && (
            <p className="text-sm text-amber-700">No rate analyses were returned by the API.</p>
          )}
          {!isLoading && !ratesError && eligibleRates.length === 0 && hasRatesForOtherProjects && (
            <p className="text-sm text-amber-700">
              All rate analyses are linked to another project and cannot be added here. This BOQ belongs to project {projectId}.
              Select a BOQ under the linked project, or unlink/reassign the rate analysis before adding it here.
            </p>
          )}
          <div><Label>Item Code *</Label><Input value={itemCode} onChange={(e) => setItemCode(e.target.value)} required /></div>
          <div><Label>Quantity *</Label><Input type="number" min="0.000001" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} required /></div>
          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending || eligibleRates.length === 0}>
              {mutation.isPending ? 'Adding...' : 'Add Item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function BoqItemDialog({
  open,
  onClose,
  projectId,
  boqId,
  currencyCode,
  item,
}: {
  open: boolean
  onClose: () => void
  projectId: string
  boqId: string
  currencyCode: string
  item?: BoqItemDto
}) {
  const [itemCode, setItemCode] = useState(item?.itemCode ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [unitCode, setUnitCode] = useState(item?.unitCode ?? '')
  const [quantity, setQuantity] = useState(String(item?.quantity ?? 1))
  const [rateAmount, setRateAmount] = useState(String(item?.rate.amount ?? 0))
  const [error, setError] = useState<string | null>(null)
  const create = useAddManualBoqItem()
  const update = useUpdateBoqItem()
  const mutation = item ? update : create

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const qty = Number(quantity)
    const rate = Number(rateAmount)
    if (!itemCode.trim() || !description.trim() || !unitCode.trim()) return setError('Item code, description, and unit are required.')
    if (!Number.isFinite(qty) || qty <= 0) return setError('Quantity must be greater than zero.')
    if (!Number.isFinite(rate) || rate < 0) return setError('Rate must be zero or greater.')
    const payload: ManualBoqItemRequest = {
      itemCode: itemCode.trim(),
      description: description.trim(),
      unitCode,
      quantity: qty,
      rateAmount: rate,
    }
    try {
      if (item) await update.mutateAsync({ projectId, boqId, itemId: item.id, payload })
      else await create.mutateAsync({ projectId, boqId, payload })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${item ? 'update' : 'add'} item`)
    }
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent onClose={onClose}>
        <h2 className="mb-4 text-xl font-bold">{item ? 'Edit BOQ Item' : 'Add Manual BOQ Item'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><Label>Item Code *</Label><Input value={itemCode} onChange={(e) => setItemCode(e.target.value)} required /></div>
          <div><Label>Description *</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} required /></div>
          <div><Label>Unit Code *</Label><Input value={unitCode} onChange={(e) => setUnitCode(e.target.value)} placeholder="e.g., m³" required /></div>
          <div><Label>Quantity *</Label><Input type="number" min="0.000001" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} required /></div>
          <div><Label>Rate ({currencyCode}) *</Label><Input type="number" min="0" step="any" value={rateAmount} onChange={(e) => setRateAmount(e.target.value)} required /></div>
          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Saving...' : item ? 'Save Changes' : 'Add Item'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
