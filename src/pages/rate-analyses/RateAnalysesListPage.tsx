import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useRateAnalyses } from '@/hooks/useRateAnalyses'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorMessage } from '@/components/shared/ErrorMessage'

export function RateAnalysesListPage() {
  const { data: rates = [], isLoading, error } = useRateAnalyses()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rate Analyses</h1>
          <p className="text-sm text-gray-500">
            Compose cost breakdowns for work items
          </p>
        </div>
        <Link to="/rate-analyses/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Rate Analysis
          </Button>
        </Link>
      </div>

      {isLoading && <LoadingSpinner label="Loading rate analyses..." />}
      {error && <ErrorMessage error={error} />}

      {!isLoading && !error && (
        <Card>
          {rates.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">No Rate Analyses yet.</p>
              <Link to="/rate-analyses/new">
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Create your first Rate Analysis
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Unit</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">Rate</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">Components</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rates.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-mono text-sm">
                        <Link to={`/rate-analyses/${r.id}`} className="text-brand hover:underline">
                          {r.code}
                        </Link>
                      </td>
                      <td className="px-6 py-4">{r.description}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{r.unitCode}</td>
                      <td className="px-6 py-4 text-right font-mono text-sm">
                        {r.totalUnitRate.amount.toFixed(2)} {r.totalUnitRate.currencyCode}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-600">
                        {r.components.length}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t border-gray-200 px-6 py-3 text-xs text-gray-500">
                {rates.length} rate analyses
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}