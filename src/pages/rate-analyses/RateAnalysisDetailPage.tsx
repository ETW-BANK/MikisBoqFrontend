import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorMessage } from '@/components/shared/ErrorMessage'
import { Card } from '@/components/ui/card'
import { useRateAnalysis } from '@/hooks/useRateAnalyses'

export function RateAnalysisDetailPage() {
  const { id } = useParams()
  const { data, isLoading, error } = useRateAnalysis(id)

  return (
    <div className="space-y-6">
      <Link to="/rate-analyses" className="inline-flex items-center gap-2 text-sm text-brand hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to Rate Analyses
      </Link>

      {isLoading && <LoadingSpinner label="Loading rate analysis..." />}
      {error && <ErrorMessage error={error} />}

      {data && (
        <>
          <div>
            <h1 className="text-2xl font-bold">{data.code} — {data.description}</h1>
            <p className="mt-1 text-sm text-gray-500">Unit: {data.unitCode} · Total Works: {data.totalWorksToBeExecuted} · Assumed Time: {data.assumedTimeInHours} hrs</p>
          </div>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Components</h2>
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Description</th>
                  <th className="px-4 py-2">Unit</th>
                  <th className="px-4 py-2 text-right">Qty</th>
                  <th className="px-4 py-2 text-right">Rate (ETB)</th>
                  <th className="px-4 py-2 text-right">Amount (ETB)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.components.map((component, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2">{component.componentType}</td>
                    <td className="px-4 py-2">{component.description}</td>
                    <td className="px-4 py-2">{component.unitCode}</td>
                    <td className="px-4 py-2 text-right">{component.quantity}</td>
                    <td className="px-4 py-2 text-right">{component.indexedRate.amount.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">{component.amount.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  )
}