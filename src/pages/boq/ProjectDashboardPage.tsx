import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Download, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ErrorMessage } from '@/components/shared/ErrorMessage'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import {
  addBoqWorkflowItem,
  deleteBoqWorkflowItem,
  downloadBoqProjectReport,
  getBoqProject,
  getBoqProjectItems,
  getBoqProjectSummary,
  searchMasterRateAnalyses,
} from '@/api/projects'
import { formatMoney } from './boqFormat'

const fieldClass = 'mt-1 h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand'

export function ProjectDashboardPage() {
  const { projectId = '' } = useParams()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [selectedAnalysisId, setSelectedAnalysisId] = useState('')
  const [itemCode, setItemCode] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [actionError, setActionError] = useState<unknown>(null)
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null)
  const [adding, setAdding] = useState(false)

  const projectQuery = useQuery({
    queryKey: ['boqProject', projectId],
    queryFn: () => getBoqProject(projectId),
    enabled: Boolean(projectId),
  })
  const itemsQuery = useQuery({
    queryKey: ['boqProjectItems', projectId],
    queryFn: () => getBoqProjectItems(projectId),
    enabled: Boolean(projectId),
  })
  const summaryQuery = useQuery({
    queryKey: ['boqProjectSummary', projectId],
    queryFn: () => getBoqProjectSummary(projectId),
    enabled: Boolean(projectId),
  })
  const analysesQuery = useQuery({
    queryKey: ['masterRateAnalyses', search],
    queryFn: () => searchMasterRateAnalyses(search),
    enabled: adding,
  })

  const selectedAnalysis = useMemo(
    () => analysesQuery.data?.find((analysis) => analysis.id === selectedAnalysisId),
    [analysesQuery.data, selectedAnalysisId]
  )
  const addItem = useMutation({
    mutationFn: addBoqWorkflowItem,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['boqProjectItems', projectId] }),
        queryClient.invalidateQueries({ queryKey: ['boqProjectSummary', projectId] }),
        queryClient.invalidateQueries({ queryKey: ['boqProjects'] }),
      ])
      setAdding(false)
      setSelectedAnalysisId('')
      setItemCode('')
      setQuantity('1')
    },
  })
  const deleteItem = useMutation({
    mutationFn: deleteBoqWorkflowItem,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['boqProjectItems', projectId] }),
        queryClient.invalidateQueries({ queryKey: ['boqProjectSummary', projectId] }),
        queryClient.invalidateQueries({ queryKey: ['boqProjects'] }),
      ])
    },
  })

  async function handleAddItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setActionError(null)
    if (!selectedAnalysis) {
      setActionError(new Error('Select a rate analysis to add.'))
      return
    }
    const parsedQuantity = Number(quantity)
    if (!itemCode.trim() || !Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      setActionError(new Error('Enter an item number and a quantity greater than zero.'))
      return
    }
    try {
      await addItem.mutateAsync({
        projectId,
        rateAnalysisId: selectedAnalysis.id,
        itemCode: itemCode.trim(),
        description: selectedAnalysis.description,
        unitCode: selectedAnalysis.unitCode,
        quantity: parsedQuantity,
      })
    } catch (error) {
      setActionError(error)
    }
  }

  async function handleExport(format: 'pdf' | 'excel') {
    setActionError(null)
    setExporting(format)
    try {
      await downloadBoqProjectReport(projectId, format)
    } catch (error) {
      setActionError(error)
    } finally {
      setExporting(null)
    }
  }

  async function handleDelete(itemId: string) {
    if (!window.confirm('Delete this BOQ item?')) return
    setActionError(null)
    try {
      await deleteItem.mutateAsync(itemId)
    } catch (error) {
      setActionError(error)
    }
  }

  const project = projectQuery.data
  const currencyCode = project?.currencyCode || 'ETB'
  const loading = projectQuery.isLoading || itemsQuery.isLoading || summaryQuery.isLoading

  return (
    <div className="space-y-6">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-brand hover:underline">
        <ArrowLeft className="h-4 w-4" /> All projects
      </Link>
      {projectQuery.error && <ErrorMessage error={projectQuery.error} />}
      {itemsQuery.error && <ErrorMessage error={itemsQuery.error} />}
      {summaryQuery.error && <ErrorMessage error={summaryQuery.error} />}
      {actionError !== null ? <ErrorMessage error={actionError} /> : null}
      {loading && <LoadingSpinner label="Loading project..." />}
      {!loading && !projectQuery.error && !itemsQuery.error && !summaryQuery.error && (
        <>
          {!project ? (
            <Card className="p-8 text-center text-gray-600">Project not found. <Link className="text-brand underline" to="/">Return to projects</Link>.</Card>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold">{project.name}</h1>
                  <p className="mt-1 text-sm text-gray-500">
                    {[project.location, project.client].filter(Boolean).join(' · ') || 'BOQ project'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" disabled={exporting !== null} onClick={() => void handleExport('pdf')}>
                    <Download className="mr-2 h-4 w-4" /> {exporting === 'pdf' ? 'Preparing PDF…' : 'Export PDF'}
                  </Button>
                  <Button variant="outline" disabled={exporting !== null} onClick={() => void handleExport('excel')}>
                    <Download className="mr-2 h-4 w-4" /> {exporting === 'excel' ? 'Preparing Excel…' : 'Export Excel'}
                  </Button>
                </div>
              </div>

              {summaryQuery.data && (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <SummaryCard label="Direct cost" value={formatMoney(summaryQuery.data.totalDirectCost, currencyCode)} />
                  <SummaryCard label="Subtotal before VAT" value={formatMoney(summaryQuery.data.subTotalBeforeVat, currencyCode)} />
                  <SummaryCard label="VAT" value={formatMoney(summaryQuery.data.vatAmount, currencyCode)} />
                  <SummaryCard label="Grand total" value={formatMoney(summaryQuery.data.grandTotal, currencyCode)} />
                </div>
              )}

              <Card className="overflow-x-auto">
                <div className="flex min-w-[700px] items-center justify-between border-b p-5">
                  <div>
                    <h2 className="text-lg font-semibold">BOQ items</h2>
                    <p className="text-sm text-gray-500">{itemsQuery.data?.length ?? 0} items · amounts use project currency</p>
                  </div>
                  <Button onClick={() => { setAdding((value) => !value); setActionError(null) }}>
                    <Plus className="mr-2 h-4 w-4" /> {adding ? 'Close' : 'Add rate-analysis item'}
                  </Button>
                </div>

                {adding && (
                  <form onSubmit={handleAddItem} className="grid gap-3 border-b bg-gray-50 p-5 md:grid-cols-4">
                    <label className="text-sm font-medium md:col-span-2">Search rate analyses
                      <input className={fieldClass} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by code or description" />
                    </label>
                    <label className="text-sm font-medium md:col-span-2">Rate analysis
                      <select
                        className={fieldClass}
                        value={selectedAnalysisId}
                        onChange={(event) => {
                          const analysisId = event.target.value
                          setSelectedAnalysisId(analysisId)
                          setItemCode(analysesQuery.data?.find((analysis) => analysis.id === analysisId)?.code ?? '')
                        }}
                        required
                      >
                        <option value="">Select an analysis</option>
                        {(analysesQuery.data ?? []).map((analysis) => (
                          <option key={analysis.id} value={analysis.id}>{analysis.code} — {analysis.description} ({analysis.unitCode})</option>
                        ))}
                      </select>
                    </label>
                    {analysesQuery.isLoading && <p className="text-xs text-gray-500 md:col-span-4">Searching…</p>}
                    {analysesQuery.error && <div className="md:col-span-4"><ErrorMessage error={analysesQuery.error} /></div>}
                    <label className="text-sm font-medium">BOQ item number
                      <input className={fieldClass} value={itemCode} onChange={(event) => setItemCode(event.target.value)} required placeholder="Select a rate analysis" />
                    </label>
                    <label className="text-sm font-medium">Quantity
                      <input className={fieldClass} value={quantity} onChange={(event) => setQuantity(event.target.value)} required type="number" min="0.000001" step="any" />
                    </label>
                    {selectedAnalysis && (
                      <p className="self-end pb-2 text-sm text-gray-600 md:col-span-2">
                        {selectedAnalysis.description} · {selectedAnalysis.unitCode}
                      </p>
                    )}
                    <div className="md:col-span-4">
                      <Button type="submit" disabled={addItem.isPending || !selectedAnalysis}>
                        {addItem.isPending ? 'Adding…' : 'Add item'}
                      </Button>
                    </div>
                  </form>
                )}

                {(itemsQuery.data?.length ?? 0) === 0 ? (
                  <div className="p-10 text-center text-sm text-gray-500">This project has no BOQ items yet. Add one from a rate analysis.</div>
                ) : (
                  <table className="w-full min-w-[800px]">
                    <thead className="border-b bg-gray-50">
                      <tr>
                        {['Item', 'Description', 'Unit', 'Quantity', 'Direct rate', 'Amount', ''].map((heading) => (
                          <th key={heading} className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 ${['Quantity', 'Direct rate', 'Amount'].includes(heading) ? 'text-right' : 'text-left'}`}>{heading}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {itemsQuery.data?.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono text-sm">{item.itemCode}</td>
                          <td className="px-4 py-3 text-sm">{item.description}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.unitCode}</td>
                          <td className="px-4 py-3 text-right text-sm">{item.quantity}</td>
                          <td className="px-4 py-3 text-right text-sm">{formatMoney(item.directRate, currencyCode)}</td>
                          <td className="px-4 py-3 text-right text-sm font-medium">{formatMoney(item.amount, currencyCode)}</td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              className="mr-3 inline-flex text-brand hover:underline"
                              aria-label={`Edit ${item.itemCode}`}
                              to={`/projects/${projectId}/items/${item.id}/edit`}
                            ><Pencil className="h-4 w-4" /></Link>
                            <button
                              type="button"
                              className="inline-flex text-red-600 hover:text-red-800 disabled:opacity-50"
                              aria-label={`Delete ${item.itemCode}`}
                              disabled={deleteItem.isPending}
                              onClick={() => void handleDelete(item.id)}
                            ><Trash2 className="h-4 w-4" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Card>
            </>
          )}
        </>
      )}
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </Card>
  )
}
