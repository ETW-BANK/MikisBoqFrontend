import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, FileText } from 'lucide-react'
import { useProject, useGenerateBoqReport } from '@/hooks/useProjects'
import { useAddBoqItemFromRateAnalysis } from '@/hooks/useBoqItems'
import { useRateAnalyses } from '@/hooks/useRateAnalyses'
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
  const [showAdd, setShowAdd] = useState(false)
  const [banner, setBanner] = useState<string | null>(null)

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />
  if (!project) return <ErrorMessage error="Project not found" />

  const boq = project.boqs.find((b) => b.id === boqId)
  if (!boq) return <ErrorMessage error="BoQ not found" />

  const handleGeneratePdf = async () => {
    await generate.mutateAsync({ projectId: project.id, boqId: boq.id })
    setBanner('BoQ PDF generation queued. Check D:\\MikisReports in a few seconds.')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/projects/${project.id}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{boq.title}</h1>
            <p className="text-sm text-gray-500">{boq.description || 'No description'}</p>
          </div>
        </div>
        <Button onClick={handleGeneratePdf} disabled={generate.isPending || boq.items.length === 0}>
          <FileText className="mr-2 h-4 w-4" />
          {generate.isPending ? 'Generating...' : 'Generate BoQ PDF'}
        </Button>
      </div>

      {banner && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">{banner}</div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Line Items</CardTitle>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item from Rate Analysis
          </Button>
        </CardHeader>
        <CardContent>
          {boq.items.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              No items yet. Click "Add Item from Rate Analysis" above.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="pb-2 text-left text-xs font-medium uppercase text-gray-500">Item Code</th>
                  <th className="pb-2 text-left text-xs font-medium uppercase text-gray-500">Description</th>
                  <th className="pb-2 text-left text-xs font-medium uppercase text-gray-500">Unit</th>
                  <th className="pb-2 text-right text-xs font-medium uppercase text-gray-500">Qty</th>
                  <th className="pb-2 text-right text-xs font-medium uppercase text-gray-500">Rate</th>
                  <th className="pb-2 text-right text-xs font-medium uppercase text-gray-500">Total</th>
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
                    <td className="py-2 text-right font-mono font-semibold">
                      {item.total.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-gray-300">
                <tr>
                  <td colSpan={5} className="pt-2 text-right font-semibold">
                    Total:
                  </td>
                  <td className="pt-2 text-right font-mono font-bold text-brand">
                    {boq.total.amount.toFixed(2)} {boq.total.currencyCode}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </CardContent>
      </Card>

      <AddItemDialog
        open={showAdd}
        onClose={() => setShowAdd(false)}
        projectId={project.id}
        boqId={boq.id}
      />
    </div>
  )
}

function AddItemDialog({
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
  const { data: rates = [] } = useRateAnalyses()
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
    const qty = parseFloat(quantity)
    if (isNaN(qty) || qty <= 0) return setError('Quantity must be > 0')

    try {
      await mutation.mutateAsync({
        projectId,
        boqId,
        payload: {
          rateAnalysisId,
          itemCode: itemCode.trim(),
          quantity: qty,
        },
      })
      setRateAnalysisId('')
      setItemCode('')
      setQuantity('1')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item')
    }
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent onClose={onClose}>
        <h2 className="mb-4 text-xl font-bold">Add Item from Rate Analysis</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Rate Analysis *</Label>
            <select
              value={rateAnalysisId}
              onChange={(e) => setRateAnalysisId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">-- Select --</option>
              {rates.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.code} — {r.description} ({r.totalUnitRate.amount.toFixed(2)} {r.totalUnitRate.currencyCode}/{r.unitCode})
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Item Code *</Label>
            <Input value={itemCode} onChange={(e) => setItemCode(e.target.value.toUpperCase())} placeholder="e.g., EW-001" />
          </div>
          <div>
            <Label>Quantity *</Label>
            <Input type="number" step="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </div>
          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Adding...' : 'Add Item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}