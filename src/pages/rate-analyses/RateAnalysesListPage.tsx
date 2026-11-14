import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useRateAnalyses } from '@/hooks/useRateAnalyses'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorMessage } from '@/components/shared/ErrorMessage'

export function RateAnalysesListPage() {
  const [page, setPage] = useState(1)
  const pageSize = 20
  const { data, isLoading, error } = useRateAnalyses(page, pageSize)
  const rates = data?.items ?? []
  const currentPage = data?.page ?? page
  const totalPages = data?.totalPages ?? 0

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
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rates.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-mono text-sm">
                        <Link to={`/rate-analyses/${r.id}`} className="text-brand hover:underline">{r.code}</Link>
                      </td>
                      <td className="px-6 py-4">{r.description}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{r.unitCode}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-6 py-3">
                <p className="text-xs text-gray-500">
                  Showing {(currentPage - 1) * (data?.size ?? pageSize) + 1}–{Math.min(currentPage * (data?.size ?? pageSize), data?.totalCount ?? 0)} of {data?.totalCount ?? 0} rate analyses
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(currentPage - 1)}
                    disabled={currentPage <= 1 || isLoading}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                  </Button>
                  <span className="min-w-20 text-center text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(currentPage + 1)}
                    disabled={currentPage >= totalPages || isLoading}
                  >
                    Next <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}