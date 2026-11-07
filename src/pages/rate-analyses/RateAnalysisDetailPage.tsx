import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, FileText, FileSpreadsheet, Pencil, Trash2 } from 'lucide-react'
import { useDeleteRateAnalysis, useGenerateReport, useRateAnalysis } from '@/hooks/useRateAnalyses'
import type { RateAnalysisDto } from '@/api/rateAnalyses'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorMessage } from '@/components/shared/ErrorMessage'

export function RateAnalysisDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: ra, isLoading, error } = useRateAnalysis(id)
  const generate = useGenerateReport()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const deleteRate = useDeleteRateAnalysis()

  if (isLoading) return <LoadingSpinner label="Loading rate analysis..." />
  if (error) return <ErrorMessage error={error} />
  if (!ra) return <ErrorMessage error="Rate analysis not found." />

  const handleDownload = async (format: 'pdf' | 'excel') => {
    setMessage(null)
    try {
      await generate.mutateAsync({ id: ra.id, format })
      setMessage({ type: 'success', text: `${format.toUpperCase()} downloaded.` })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to download the report.' })
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`Delete rate analysis "${ra.code}"? It cannot be deleted while used by a BOQ line.`)) return
    try {
      await deleteRate.mutateAsync(ra.id)
      navigate('/rate-analyses')
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to delete rate analysis.' })
    }
  }
  const componentGroups = [
    { type: 'Material', title: 'Materials (1.01)' },
    { type: 'Labour', title: 'Labour (1.02)' },
    { type: 'Equipment', title: 'Equipment (1.03)' },
    { type: 'Transport', title: 'Transport' },
  ].map((group) => ({
    ...group,
    components: ra.components.filter(
      (component) => component.componentType.toLowerCase() === group.type.toLowerCase()
    ),
  }))
  const knownTypes = new Set(componentGroups.map((group) => group.type.toLowerCase()))
  const otherComponents = ra.components.filter(
    (component) => !knownTypes.has(component.componentType.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/rate-analyses')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{ra.code}</h1>
            <p className="text-sm text-gray-500">{ra.description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleDownload('pdf')} disabled={generate.isPending}>
            <FileText className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button variant="outline" onClick={() => handleDownload('excel')} disabled={generate.isPending}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button variant="outline" onClick={() => navigate(`/rate-analyses/${ra.id}/edit`)}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteRate.isPending}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      {message && (
        <div className={`rounded-md p-3 text-sm ${message.type === 'error' ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
          {message.text}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Unit" value={ra.unitCode} />
        <Stat label="Total Works" value={`${ra.totalWorksToBeExecuted} ${ra.unitCode}`} />
        <Stat label="Performance" value={`${ra.performanceRatePerHour.toFixed(2)} ${ra.unitCode}/hr`} />
      </div>

      {ra.remark && (
        <Card>
          <CardHeader><CardTitle>Remark</CardTitle></CardHeader>
          <CardContent className="text-sm">{ra.remark}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Components</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          {componentGroups.map((group) => group.components.length > 0 && (
            <ComponentTable
              key={group.type}
              title={group.title}
              type={group.type}
              components={group.components}
            />
          ))}
          {otherComponents.length > 0 && (
            <ComponentTable title="Other Components" type="Other" components={otherComponents} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Calculation</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <TotalRow label="A = Direct Material Unit Cost" value={ra.directMaterialUnitCost.amount} />
          <TotalRow label="B = Direct Man Power Unit Cost" value={ra.directLabourUnitCost.amount} />
          <TotalRow label="C = Direct Equipment Unit Cost" value={ra.directEquipmentUnitCost.amount} />
          <div className="border-t border-gray-200 pt-2" />
          <TotalRow label="Direct Unit Cost" value={ra.directUnitCost.amount} bold />
          <TotalRow label="Overhead & Profit" value={ra.overheadAndProfit.amount} />
          <div className="border-t border-gray-200 pt-2" />
          <TotalRow
            label="Total Unit Rate"
            value={ra.totalUnitRate.amount}
            suffix={`${ra.totalUnitRate.currencyCode}/${ra.unitCode}`}
            bold
            highlight
          />
        </CardContent>
      </Card>

      <Link to="/rate-analyses">
        <Button variant="outline">Back to list</Button>
      </Link>
    </div>
  )
}

function ComponentTable({
  title,
  type,
  components,
}: {
  title: string
  type: string
  components: RateAnalysisDto['components']
}) {
  const isMaterial = type === 'Material'
  const isLabour = type === 'Labour'
  const rateLabel = isLabour ? 'Indexed Wage/hr' : type === 'Equipment' ? 'Rental/hr' : 'Rate'

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200">
            <tr>
              <th className="pb-2 text-left text-xs font-medium uppercase text-gray-500">
                {isMaterial ? 'Material' : isLabour ? 'Labor by Trade' : type === 'Equipment' ? 'Equipment Type' : 'Description'}
              </th>
              <th className="pb-2 text-right text-xs font-medium uppercase text-gray-500">
                {isMaterial ? 'Qty' : 'No.'}
              </th>
              {!isMaterial && (
                <th className="pb-2 text-right text-xs font-medium uppercase text-gray-500">UF</th>
              )}
              <th className="pb-2 text-right text-xs font-medium uppercase text-gray-500">
                {isMaterial ? 'Unit Price' : rateLabel}
              </th>
              {isMaterial && (
                <th className="pb-2 text-right text-xs font-medium uppercase text-gray-500">Additional Cost</th>
              )}
              <th className="pb-2 text-right text-xs font-medium uppercase text-gray-500">
                {isMaterial ? 'Amount' : type === 'Other' ? 'Amount' : 'Hourly Cost'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {components.map((component, index) => (
              <tr key={`${component.componentType}-${component.description}-${index}`}>
                <td className="py-2">{component.description}</td>
                <td className="py-2 text-right font-mono">
                  {component.quantity}{isMaterial && ` ${component.unitCode}`}
                </td>
                {!isMaterial && (
                  <td className="py-2 text-right font-mono">{component.utilizationFactor}</td>
                )}
                <td className="py-2 text-right font-mono">
                  {component.indexedRate.amount.toFixed(2)} {component.indexedRate.currencyCode}/{component.unitCode}
                </td>
                {isMaterial && (
                  <td className="py-2 text-right font-mono">
                    {component.additionalCost
                      ? `${component.additionalCost.amount.toFixed(2)} ${component.additionalCost.currencyCode}`
                      : '—'}
                  </td>
                )}
                <td className="py-2 text-right font-mono">
                  {component.amount.amount.toFixed(2)} {component.amount.currencyCode}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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

function TotalRow({
  label,
  value,
  bold,
  highlight,
  suffix,
}: {
  label: string
  value: number
  bold?: boolean
  highlight?: boolean
  suffix?: string
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className={bold ? 'font-semibold' : 'text-gray-600'}>{label}</span>
      <span
        className={`font-mono ${bold ? 'font-semibold' : ''} ${
          highlight ? 'text-brand text-lg' : ''
        }`}
      >
        {value.toFixed(2)} {suffix ?? 'ETB'}
      </span>
    </div>
  )
}