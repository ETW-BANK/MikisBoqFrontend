import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, FileText, FileSpreadsheet } from 'lucide-react'
import { useGenerateReport, useRateAnalysis } from '@/hooks/useRateAnalyses'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorMessage } from '@/components/shared/ErrorMessage'

export function RateAnalysisDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: ra, isLoading, error } = useRateAnalysis(id)
  const generate = useGenerateReport()
  const [lastGenerated, setLastGenerated] = useState<string | null>(null)

  if (isLoading) return <LoadingSpinner label="Loading rate analysis..." />
  if (error) return <ErrorMessage error={error} />
  if (!ra) return <ErrorMessage error="Rate analysis not found." />

  const handleDownload = async (format: 'pdf' | 'excel') => {
    await generate.mutateAsync({ id: ra.id, format })
    setLastGenerated(
      `${format.toUpperCase()} generation queued. Check D:\\MikisReports in a few seconds.`
    )
  }

  const hasProjectInfo = ra.project || ra.location || ra.client || ra.consultant || ra.contractor || ra.remark

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
        </div>
      </div>

      {lastGenerated && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">{lastGenerated}</div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Unit" value={ra.unitCode} />
        <Stat label="Total Works" value={`${ra.totalWorksToBeExecuted} ${ra.unitCode}`} />
        <Stat label="Performance" value={`${ra.performanceRatePerHour.toFixed(2)} ${ra.unitCode}/hr`} />
      </div>

      {hasProjectInfo && (
        <Card>
          <CardHeader><CardTitle>Project Info</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 text-sm md:grid-cols-3">
            {ra.project && <div><span className="text-gray-500">Project:</span> {ra.project}</div>}
            {ra.location && <div><span className="text-gray-500">Location:</span> {ra.location}</div>}
            {ra.client && <div><span className="text-gray-500">Client:</span> {ra.client}</div>}
            {ra.consultant && <div><span className="text-gray-500">Consultant:</span> {ra.consultant}</div>}
            {ra.contractor && <div><span className="text-gray-500">Contractor:</span> {ra.contractor}</div>}
            {ra.remark && <div><span className="text-gray-500">Remark:</span> {ra.remark}</div>}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Components</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200">
              <tr>
                <th className="pb-2 text-left text-xs font-medium uppercase text-gray-500">Type</th>
                <th className="pb-2 text-left text-xs font-medium uppercase text-gray-500">Description</th>
                <th className="pb-2 text-right text-xs font-medium uppercase text-gray-500">Qty</th>
                <th className="pb-2 text-right text-xs font-medium uppercase text-gray-500">UF</th>
                <th className="pb-2 text-right text-xs font-medium uppercase text-gray-500">Rate</th>
                <th className="pb-2 text-right text-xs font-medium uppercase text-gray-500">Additional</th>
                <th className="pb-2 text-right text-xs font-medium uppercase text-gray-500">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ra.components.map((c, i) => (
                <tr key={i}>
                  <td className="py-2">{c.componentType}</td>
                  <td className="py-2">{c.description}</td>
                  <td className="py-2 text-right font-mono">{c.quantity}</td>
                  <td className="py-2 text-right font-mono">{c.utilizationFactor}</td>
                  <td className="py-2 text-right font-mono">{c.indexedRate.amount.toFixed(2)}</td>
                  <td className="py-2 text-right font-mono">
                    {c.additionalCost ? c.additionalCost.amount.toFixed(2) : '—'}
                  </td>
                  <td className="py-2 text-right font-mono">{c.amount.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
            suffix={`ETB/${ra.unitCode}`}
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