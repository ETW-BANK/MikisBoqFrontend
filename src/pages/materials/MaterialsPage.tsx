import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { useMaterials } from '@/hooks/useMaterials'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorMessage } from '@/components/shared/ErrorMessage'
import { CreateMaterialDialog } from './CreateMaterialDialog'

export function MaterialsPage() {
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const { data: materials = [], isLoading, error } = useMaterials()

  const filtered = materials.filter((m) => {
    const term = search.toLowerCase()
    return m.code.toLowerCase().includes(term) || m.name.toLowerCase().includes(term)
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Materials</h1>
          <p className="text-sm text-gray-500">Manage your material database</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Material
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search by code or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading && <LoadingSpinner label="Loading materials..." />}

      {error && <ErrorMessage error={error} />}

      {!isLoading && !error && (
        <Card>
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">
                {search ? 'No materials match your search.' : 'No materials yet.'}
              </p>
              {!search && (
                <Button className="mt-4" onClick={() => setShowCreate(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add your first material
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Unit</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-mono text-sm">{m.code}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium">{m.name}</div>
                        {m.description && (
                          <div className="text-xs text-gray-500">{m.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{m.unitCode}</td>
                      <td className="px-6 py-4 text-right font-mono text-sm">
                        {m.currentRate.amount.toFixed(2)} {m.currentRate.currencyCode}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={
                            m.isActive
                              ? 'inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800'
                              : 'inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800'
                          }
                        >
                          {m.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t border-gray-200 px-6 py-3 text-xs text-gray-500">
                Showing {filtered.length} of {materials.length} materials
              </div>
            </div>
          )}
        </Card>
      )}

      <CreateMaterialDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
      />
    </div>
  )
}