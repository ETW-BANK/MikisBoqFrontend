import axios from 'axios'
import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ErrorMessage } from '@/components/shared/ErrorMessage'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { getBoqItem, listBoqProjects, updateBoqItem } from '@/api/projects'
import type { BoqItemComponent, BoqItemDetail } from '@/api/projects'
import {
  listMasterDataEquipments,
  listMasterDataLabors,
  listMasterDataMaterials,
} from '@/api/masterData'
import type {
  MasterDataEquipment,
  MasterDataLabor,
  MasterDataMaterial,
} from '@/api/masterData'
import { formatMoney, numberInputValue } from './boqFormat'

const fieldClass = 'mt-1 h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand'

function emptyComponent(): BoqItemComponent {
  return {
    componentType: 'Material',
    description: '',
    unitCode: '',
    quantity: 0,
    utilizationFactor: 1,
    overtimeFactor: 1,
    indexedRate: 0,
    additionalCost: 0,
  }
}

export function ItemEditorPage() {
  const { projectId = '', itemId = '' } = useParams()
  const itemQuery = useQuery({
    queryKey: ['boqItem', itemId],
    queryFn: () => getBoqItem(itemId),
    enabled: Boolean(itemId),
  })
  const projectsQuery = useQuery({
    queryKey: ['boqProjects'],
    queryFn: listBoqProjects,
  })

  return (
    <div className="w-full space-y-6">
      <Link to={`/projects/${projectId}`} className="inline-flex items-center gap-2 text-sm text-brand hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to project
      </Link>
      {itemQuery.isLoading && <LoadingSpinner label="Loading BOQ item..." />}
      {itemQuery.error && <ErrorMessage error={itemQuery.error} />}
      {axios.isAxiosError(itemQuery.error) &&
        itemQuery.error.response?.status === 404 &&
        String(itemQuery.error.response.data).includes('Rate Analysis not found') && (
          <Card className="border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            This BOQ item still exists, but its linked rate analysis is missing from the API data, so its component breakdown cannot be edited. Return to the project dashboard to remove this item if it is no longer needed, or restore its rate analysis in the backend.
          </Card>
        )}
      {itemQuery.data && (
        <ItemEditorForm
          key={itemId}
          projectId={projectId}
          itemId={itemId}
          item={itemQuery.data}
          currencyCode={projectsQuery.data?.find((project) => project.id === projectId)?.currencyCode || 'ETB'}
        />
      )}
    </div>
  )
}

function ItemEditorForm({ projectId, itemId, item, currencyCode }: {
  projectId: string
  itemId: string
  item: BoqItemDetail
  currencyCode: string
}) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [quantity, setQuantity] = useState(item.quantity)
  const [totalWorks, setTotalWorks] = useState(item.totalWorks)
  const [assumedTimeHours, setAssumedTimeHours] = useState(item.assumedTimeHours)
  const [components, setComponents] = useState(item.components)
  const [customComponentModes, setCustomComponentModes] = useState<Map<number, boolean>>(() => new Map())
  const [saveError, setSaveError] = useState<unknown>(null)

  // --- QUERIES ---
  const materialsQuery = useQuery({ queryKey: ['masterData', 'materials'], queryFn: listMasterDataMaterials })
  const laborsQuery = useQuery({ queryKey: ['masterData', 'labors'], queryFn: listMasterDataLabors })
  const equipmentsQuery = useQuery({ queryKey: ['masterData', 'equipments'], queryFn: listMasterDataEquipments })

  // --- CALCULATIONS ---
  // 1. Define performanceRate here so the JSX can see it
  const performanceRate = assumedTimeHours > 0 ? totalWorks / assumedTimeHours : 0

  const calculatedRate = useMemo(() => {
    if (totalWorks <= 0 || assumedTimeHours <= 0) return null
    
    const materialCost = components
      .filter((component) => component.componentType === 'Material')
      .reduce((sum, component) => sum + (component.indexedRate + component.additionalCost) * component.quantity, 0)
    const labourCost = components
      .filter((component) => component.componentType === 'Labour')
      .reduce((sum, component) => sum + component.indexedRate * component.quantity * component.utilizationFactor * component.overtimeFactor, 0)
    const equipmentCost = components
      .filter((component) => component.componentType === 'Equipment')
      .reduce((sum, component) => sum + component.indexedRate * component.quantity * component.utilizationFactor * component.overtimeFactor, 0)
      
    return materialCost + labourCost / performanceRate + equipmentCost / performanceRate
  }, [assumedTimeHours, components, totalWorks, performanceRate])

  const showLabourFactors = components.some((component) => component.componentType !== 'Material')

  const updateItem = useMutation({
    mutationFn: () => updateBoqItem(itemId, { quantity, totalWorks, assumedTimeHours, components }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['boqProjectItems', projectId] }),
        queryClient.invalidateQueries({ queryKey: ['boqProjectSummary', projectId] }),
        queryClient.invalidateQueries({ queryKey: ['boqProjects'] }),
        queryClient.invalidateQueries({ queryKey: ['boqItem', itemId] }),
      ])
      navigate(`/projects/${projectId}`)
    },
  })

  function updateComponent(index: number, patch: Partial<BoqItemComponent>) {
    setComponents((current) => current.map((component, componentIndex) =>
      componentIndex === index ? { ...component, ...patch } : component
    ))
  }

  function setComponentCustom(index: number, isCustom: boolean) {
    setCustomComponentModes((current) => {
      const next = new Map(current)
      next.set(index, isCustom)
      return next
    })
  }

  function resetComponentCustom(index: number) {
    setCustomComponentModes((current) => {
      const next = new Map(current)
      next.delete(index)
      return next
    })
  }

  function removeComponent(index: number) {
    setComponents((current) => current.filter((_, componentIndex) => componentIndex !== index))
    setCustomComponentModes((current) => new Map([...current]
      .filter(([componentIndex]) => componentIndex !== index)
      .map(([componentIndex, isCustom]) => [componentIndex > index ? componentIndex - 1 : componentIndex, isCustom])))
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaveError(null)
    if (quantity <= 0 || totalWorks <= 0 || assumedTimeHours <= 0) {
      setSaveError(new Error('Quantity, total works, and assumed hours must all be greater than zero.'))
      return
    }
    if (components.some((component) => !component.description.trim() || component.quantity < 0 || component.indexedRate < 0)) {
      setSaveError(new Error('Each component needs a description and non-negative quantity and rate.'))
      return
    }
    try {
      await updateItem.mutateAsync()
    } catch (error) {
      setSaveError(error)
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      {/* ... errors and title ... */}

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold">Work quantities</h2>
        <div className="grid gap-4 sm:grid-cols-4"> 
          
          <label className="text-sm font-medium">BOQ quantity ({item.unitCode})
            <input className={fieldClass} type="number" min="0.000001" step="any" value={numberInputValue(quantity)} onChange={(event) => setQuantity(Number(event.target.value))} />
          </label>
          
          <label className="text-sm font-medium">Total works
            <input className={fieldClass} type="number" min="0.000001" step="any" value={numberInputValue(totalWorks)} onChange={(event) => setTotalWorks(Number(event.target.value))} />
          </label>
          
          <label className="text-sm font-medium">Assumed time (hours)
            <input className={fieldClass} type="number" min="0.000001" step="any" value={numberInputValue(assumedTimeHours)} onChange={(event) => setAssumedTimeHours(Number(event.target.value))} />
          </label>

          <label className="text-sm font-medium">Performance Rate ({item.unitCode}/hr)
            <input 
              className={`${fieldClass} bg-gray-100 text-gray-700 cursor-not-allowed`} 
              value={performanceRate.toFixed(2)} 
              readOnly 
              tabIndex={-1}
            />
          </label>
          
        </div>
      </Card>


      <Card className="w-full overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b p-5">
          <div>
            <h2 className="text-lg font-semibold">Rate-analysis components</h2>
            <p className="text-sm text-gray-500">The rate updates live using the backend pricing formula.</p>
          </div>
          <Button type="button" variant="outline" onClick={() => setComponents((current) => [...current, emptyComponent()])}>
            <Plus className="mr-2 h-4 w-4" /> Add component
          </Button>
        </div>
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-[13%]" />
            <col className="w-[29%]" />
            <col className="w-[11%]" />
            <col className="w-[8%]" />
            {showLabourFactors && (
              <>
                <col className="w-[8%]" />
                <col className="w-[8%]" />
              </>
            )}
            <col className={showLabourFactors ? 'w-[9%]' : 'w-[15%]'} />
            <col className={showLabourFactors ? 'w-[11%]' : 'w-[19%]'} />
            <col className="w-[5%]" />
          </colgroup>
          <thead className="border-b bg-gray-50">
            <tr>
              {[
                'Type',
                'Description',
                'Unit',
                'Quantity',
                ...(showLabourFactors ? ['Utilization', 'Overtime'] : []),
                'Indexed rate',
                'Additional cost',
                '',
              ].map((heading) => (
                <th key={heading} className={`px-2 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 ${['Quantity', 'Utilization', 'Overtime', 'Indexed rate', 'Additional cost'].includes(heading) ? 'text-right' : 'text-left'}`}>{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {components.map((component, index) => (
              <tr key={`${component.description}-${index}`}>
                <td className="px-2 py-2">
                  <select className={`${fieldClass} min-w-0 px-2 text-xs`} value={component.componentType} onChange={(event) => {
                    resetComponentCustom(index)
                    updateComponent(index, { componentType: event.target.value as BoqItemComponent['componentType'] })
                  }}>
                    <option value="Material">Material</option>
                    <option value="Labour">Labour</option>
                    <option value="Equipment">Equipment</option>
                  </select>
                </td>
                <td className="px-2 py-2">
                  {(() => {
                    const isMaterial = component.componentType === 'Material'
                    const isLabour = component.componentType === 'Labour'
                    const options = isMaterial
                      ? materialsQuery.data ?? []
                      : isLabour ? laborsQuery.data ?? [] : equipmentsQuery.data ?? []
                    const selectedId = isMaterial
                      ? materialsQuery.data?.find((material) =>
                        material.name === component.description && material.unitCode === component.unitCode
                      )?.id
                      : isLabour
                        ? laborsQuery.data?.find((labor) => labor.trade === component.description)?.id
                        : equipmentsQuery.data?.find((equipment) => equipment.name === component.description)?.id
                    const custom = customComponentModes.get(index) ?? Boolean(component.description && !selectedId)
                    const loading = isMaterial
                      ? materialsQuery.isLoading
                      : isLabour ? laborsQuery.isLoading : equipmentsQuery.isLoading

                    if (custom) {
                      return (
                        <div className="space-y-1">
                          <input
                            className={`${fieldClass} min-w-0 px-2`}
                            value={component.description}
                            onChange={(event) => updateComponent(index, { description: event.target.value })}
                            aria-label={`Custom ${component.componentType.toLowerCase()} name`}
                            placeholder={`Custom ${component.componentType.toLowerCase()} name`}
                          />
                          <button
                            type="button"
                            className="text-xs text-brand hover:underline"
                            onClick={() => setComponentCustom(index, false)}
                          >
                            Choose from master data
                          </button>
                        </div>
                      )
                    }

                    const label = isMaterial ? 'Select material' : isLabour ? 'Select trade' : 'Select equipment'
                    const display = (option: MasterDataMaterial | MasterDataLabor | MasterDataEquipment) => {
                      if (isMaterial) {
                        const material = option as MasterDataMaterial
                        return `${material.name} (${material.unitCode}) — ${material.defaultUnitPrice.toFixed(2)} ETB`
                      }
                      if (isLabour) {
                        const labor = option as MasterDataLabor
                        return `${labor.trade} — ${labor.indexedWage.toFixed(2)} ETB/hr`
                      }
                      const equipment = option as MasterDataEquipment
                      return `${equipment.name} — ${equipment.totalCostPerHr.toFixed(2)} ETB/hr`
                    }

                    return (
                      <select
                        className={`${fieldClass} min-w-0 px-2`}
                        aria-label={label}
                        value={selectedId ?? ''}
                        onChange={(event) => {
                          const value = event.target.value
                          if (value === 'Other') {
                            setComponentCustom(index, true)
                            return
                          }
                          setComponentCustom(index, false)
                          if (isMaterial) {
                            const material = materialsQuery.data?.find((entry) => entry.id === value)
                            if (material) updateComponent(index, {
                              description: material.name,
                              unitCode: material.unitCode,
                              indexedRate: material.defaultUnitPrice,
                              additionalCost: material.defaultAdditionalCost,
                            })
                          } else if (isLabour) {
                            const labor = laborsQuery.data?.find((entry) => entry.id === value)
                            if (labor) updateComponent(index, {
                              description: labor.trade,
                              unitCode: 'HR',
                              indexedRate: labor.indexedWage,
                            })
                          } else {
                            const equipment = equipmentsQuery.data?.find((entry) => entry.id === value)
                            if (equipment) updateComponent(index, {
                              description: equipment.name,
                              unitCode: 'HR',
                              indexedRate: equipment.totalCostPerHr,
                            })
                          }
                        }}
                      >
                        <option value="">{loading ? 'Loading…' : `-- ${label} --`}</option>
                        {options.map((option) => (
                          <option key={option.id} value={option.id}>{display(option)}</option>
                        ))}
                        <option value="Other">-- Other / Custom --</option>
                      </select>
                    )
                  })()}
                </td>
                <td className="px-2 py-2">
                  <input
                    className={`${fieldClass} min-w-0 px-2 text-xs`}
                    value={component.unitCode}
                    onChange={(event) => updateComponent(index, { unitCode: event.target.value })}
                    aria-label={`Unit for ${component.description || `component ${index + 1}`}`}
                  />
                </td>
                <td className="px-2 py-2"><input className={`${fieldClass} min-w-0 px-2 text-right text-xs`} type="number" min="0" step="any" value={numberInputValue(component.quantity)} onChange={(event) => updateComponent(index, { quantity: Number(event.target.value) })} /></td>
                {showLabourFactors && (
                  <>
                    <td className="px-2 py-2">
                      {component.componentType !== 'Material' && (
                    <input className={`${fieldClass} min-w-0 px-2 text-right text-xs`} type="number" min="0" step="any" value={numberInputValue(component.utilizationFactor)} onChange={(event) => updateComponent(index, { utilizationFactor: Number(event.target.value) })} />
                      )}
                    </td>
                    <td className="px-2 py-2">
                      {component.componentType !== 'Material' && (
                    <input className={`${fieldClass} min-w-0 px-2 text-right text-xs`} type="number" min="0" step="any" value={numberInputValue(component.overtimeFactor)} onChange={(event) => updateComponent(index, { overtimeFactor: Number(event.target.value) })} />
                      )}
                    </td>
                  </>
                )}
                <td className="px-2 py-2"><input className={`${fieldClass} min-w-0 px-2 text-right text-xs`} type="number" min="0" step="any" value={numberInputValue(component.indexedRate)} onChange={(event) => updateComponent(index, { indexedRate: Number(event.target.value) })} /></td>
                <td className="px-2 py-2"><input className={`${fieldClass} min-w-0 px-2 text-right text-xs`} type="number" min="0" step="any" value={numberInputValue(component.additionalCost)} disabled={component.componentType !== 'Material'} onChange={(event) => updateComponent(index, { additionalCost: Number(event.target.value) })} /></td>
                <td className="px-2 py-2">
                  <button type="button" aria-label={`Remove component ${index + 1}`} className="text-red-600 hover:text-red-800" onClick={() => removeComponent(index)}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {components.length === 0 && <p className="p-6 text-sm text-gray-500">No components. Add a component to calculate the rate.</p>}
      </Card>

      <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="text-sm text-gray-500">Calculated direct unit rate</p>
          <p className="mt-1 text-xl font-semibold">{calculatedRate == null ? 'Enter positive total works and assumed hours' : formatMoney(calculatedRate, currencyCode)}</p>
          <p className="mt-1 text-sm text-gray-500">Estimated BOQ amount: {calculatedRate == null ? '—' : formatMoney(calculatedRate * quantity, currencyCode)}</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate(`/projects/${projectId}`)}>Cancel</Button>
          <Button type="submit" disabled={updateItem.isPending || calculatedRate == null}>
            {updateItem.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </Card>
    </form>
  )
}
