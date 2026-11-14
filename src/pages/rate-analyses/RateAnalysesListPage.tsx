import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react'
import { useRateAnalyses } from '@/hooks/useRateAnalyses'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorMessage } from '@/components/shared/ErrorMessage'

export function RateAnalysesListPage() {
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const pageSize = 20
  const { data, isLoading, error } = useRateAnalyses(page, pageSize)
  
  // 1. Get the raw items from the API
  const allRates = data?.items ?? []
  
  // 2. Filter them locally based on the search input
  const filteredRates = useMemo(() => {
    if (!searchQuery.trim()) return allRates
    const lowerSearch = searchQuery.toLowerCase()
    return allRates.filter(
      (r) =>
        r.code.toLowerCase().includes(lowerSearch) ||
        r.description.toLowerCase().includes(lowerSearch)
    )
  }, [allRates, searchQuery])

  // 3. If searching, hide pagination (show all results). Otherwise, paginate.
  const isSearching = searchQuery.trim().length > 0
  const displayedRates = isSearching ? filteredRates : allRates
  const currentPage = data?.page ?? page
  const totalPages = data?.totalPages ?? 0

  return (
    <div className="space-y-6">
      {/* HEADER & SEARCH */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rate Analyses</h1>
          <p className="text-sm text-gray-500">
            Compose cost breakdowns for work items
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* SEARCH BAR */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by code or description..."
              className="h-10 w-64 rounded-md border border-gray-300 pl-9 pr-3 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1) // Reset to page 1 when searching
              }}
            />
          </div>

          <Link to="/rate-analyses/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Rate Analysis
            </Button>
          </Link>
        </div>
      </div>

      {isLoading && <LoadingSpinner label="Loading rate analyses..." />}
      {error && <ErrorMessage error={error} />}

      {!isLoading && !error && (
        <Card>
          {displayedRates.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">
                {isSearching ? `No rate analyses found matching "${searchQuery}"` : 'No Rate Analyses yet.'}
              </p>
              {!isSearching && (
                <Link to="/rate-analyses/new">
                  <Button className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Create your first Rate Analysis
                  </Button>
                </Link>
              )}
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
                  {displayedRates.map((r) => (
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
              
              {/* PAGINATION (Only show if not searching) */}
              {!isSearching && (
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
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}