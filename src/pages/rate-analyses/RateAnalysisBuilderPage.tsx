import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useParams } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { useMaterials } from '@/hooks/useMaterials'
import { useCreateRateAnalysis, useRateAnalysis, useUpdateRateAnalysis } from '@/hooks/useRateAnalyses'
import { useProjects } from '@/hooks/useProjects'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { RateAnalysisDto, RateComponentInput } from '@/api/rateAnalyses'
import type { Material } from '@/api/materials'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorMessage } from '@/components/shared/ErrorMessage'

type ComponentType = 'Material' | 'Labour' | 'Equipment' | 'Transport'
const UNIT_OPTIONS = ['EA', 'M3', 'M2', 'LM', 'KG', 'TON', 'HR', 'DAY', 'LS']
const COMPONENT_TYPES: readonly ComponentType[] = ['Material', 'Labour', 'Equipment', 'Transport']

interface BuilderComponent {
  id: string
  type: ComponentType
  materialCode?: string
  description?: string
  unitCode: string
  currencyCode: string
  quantity: number
  utilizationFactor: number
  indexedRate: number
  additionalCost?: number
  overrideRate?: string
}

function newComponent(type: ComponentType): BuilderComponent {
  return {
    id: crypto.randomUUID(),
    type,
    unitCode: type === 'Material' ? 'M3' : 'HR',
    currencyCode: 'ETB',
    quantity: 1,
    utilizationFactor: 1,
    indexedRate: 0,
    additionalCost: 0,
  }
}

export function RateAnalysisBuilderPage() {
  const { id } = useParams<{ id: string }>()
  const rateQuery = useRateAnalysis(id)
  if (id && rateQuery.isLoading) return <LoadingSpinner label="Loading rate analysis..." />
  if (id && rateQuery.error) return <ErrorMessage error={rateQuery.error} />
  if (id && !rateQuery.data) return <ErrorMessage error="Rate analysis not found." />
  const invalidType = rateQuery.data?.components.find((component) => !isComponentType(component.componentType))
  if (invalidType) return <ErrorMessage error={`Unsupported rate component type: ${invalidType.componentType}`} />

  return <RateAnalysisForm key={id ?? 'new'} id={id} rateAnalysis={rateQuery.data} />
}

function isComponentType(value: string): value is ComponentType {
  return COMPONENT_TYPES.some((type) => type === value)
}

function RateAnalysisForm({ id, rateAnalysis }: { id?: string; rateAnalysis?: RateAnalysisDto }) {
  const navigate = useNavigate()
  const { data: materials = [] } = useMaterials()
  const { data: projects = [] } = useProjects()
  const create = useCreateRateAnalysis()
  const update = useUpdateRateAnalysis()
  const mutation = id ? update : create

  // Header fields
  const [code, setCode] = useState(rateAnalysis?.code ?? '')
  const [description, setDescription] = useState(rateAnalysis?.description ?? '')
  const [unitCode, setUnitCode] = useState(rateAnalysis?.unitCode ?? 'M2')
  const [totalWorks, setTotalWorks] = useState(String(rateAnalysis?.totalWorksToBeExecuted ?? 1))
  const [assumedTime, setAssumedTime] = useState(String(rateAnalysis?.assumedTimeInHours ?? 8))
  const [overheadPercent, setOverheadPercent] = useState(String(
    rateAnalysis && rateAnalysis.directUnitCost.amount > 0
      ? rateAnalysis.overheadAndProfit.amount / rateAnalysis.directUnitCost.amount * 100
      : 0
  ))

  const [linkedProjectId, setLinkedProjectId] = useState(rateAnalysis?.linkedProjectId ?? '')
  const [remark, setRemark] = useState(rateAnalysis?.remark ?? '')

  const [components, setComponents] = useState<BuilderComponent[]>(() =>
    rateAnalysis?.components.flatMap((component) => isComponentType(component.componentType) ? [{
      id: crypto.randomUUID(),
      type: component.componentType,
      materialCode: component.materialCode ?? undefined,
      description: component.description,
      unitCode: component.unitCode,
      currencyCode: component.indexedRate.currencyCode,
      quantity: component.quantity,
      utilizationFactor: component.utilizationFactor,
      indexedRate: component.indexedRate.amount,
      additionalCost: component.additionalCost?.amount ?? 0,
      overrideRate: component.componentType === 'Material'
        ? String(component.indexedRate.amount)
        : undefined,
    }] : []) ?? []
  )
  const [error, setError] = useState<string | null>(null)

  // ---------- LIVE MATH ----------
  const totalWorksNum = parseFloat(totalWorks) || 0
  const assumedTimeNum = parseFloat(assumedTime) || 0
  const overheadNum = parseFloat(overheadPercent) || 0
  const performanceRate = assumedTimeNum > 0 ? totalWorksNum / assumedTimeNum : 0

  const componentRate = (component: BuilderComponent) =>
    component.overrideRate?.trim() ? Number(component.overrideRate) : component.indexedRate

  const materialTotal = components
    .filter((c) => c.type === 'Material')
    .reduce((sum, c) => sum + (componentRate(c) * c.quantity) + (c.additionalCost ?? 0), 0)

  const labourTotal = components
    .filter((c) => c.type === 'Labour')
    .reduce((sum, c) => sum + c.indexedRate * c.quantity * c.utilizationFactor, 0)

  const equipmentTotal = components
    .filter((c) => c.type === 'Equipment')
    .reduce((sum, c) => sum + c.indexedRate * c.quantity * c.utilizationFactor, 0)
  const transportTotal = components
    .filter((c) => c.type === 'Transport')
    .reduce((sum, c) => sum + c.indexedRate * c.quantity * c.utilizationFactor, 0)

  const directMaterial = materialTotal
  const directLabour = performanceRate > 0 ? labourTotal / performanceRate : 0
  const directEquipment = performanceRate > 0 ? (equipmentTotal + transportTotal) / performanceRate : 0
  const directUnitCost = directMaterial + directLabour + directEquipment
  const overhead = directUnitCost * (overheadNum / 100)
  const totalRate = directUnitCost + overhead

  // ---------- ACTIONS ----------
  const addComponent = (type: ComponentType) => {
    setComponents([...components, newComponent(type)])
  }

  const updateComponent = (id: string, patch: Partial<BuilderComponent>) => {
    setComponents(components.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }

  const removeComponent = (id: string) => {
    setComponents(components.filter((c) => c.id !== id))
  }

  const handleMaterialSelect = (id: string, matCode: string) => {
    const mat = materials.find((m) => m.code === matCode)
    if (!mat) return
    updateComponent(id, {
      materialCode: matCode,
      description: mat.name,
      unitCode: mat.unitCode,
      currencyCode: mat.currentRate.currencyCode,
      indexedRate: mat.currentRate.amount,
      overrideRate: '',
    })
  }

  const handleProjectSelect = (pid: string) => {
    setLinkedProjectId(pid)
  }

  const handleSave = async () => {
    setError(null)

    if (!code.trim()) return setError('Code is required')
    if (!description.trim()) return setError('Description is required')
    if (!Number.isFinite(totalWorksNum) || totalWorksNum <= 0) return setError('Total works must be > 0')
    if (!Number.isFinite(assumedTimeNum) || assumedTimeNum <= 0) return setError('Assumed time must be > 0')
    if (!Number.isFinite(overheadNum) || overheadNum < 0) return setError('Overhead percentage must be zero or greater.')
    if (components.length === 0) return setError('Add at least one component')
    if (components.some((component) => !Number.isFinite(component.quantity) || component.quantity <= 0)) {
      return setError('Every component quantity must be greater than zero.')
    }
    if (components.some((component) =>
      !Number.isFinite(component.utilizationFactor) || component.utilizationFactor < 0
    )) return setError('Component utilization factors must be zero or greater.')
    if (components.some((component) => component.type === 'Material' && !component.materialCode)) {
      return setError('Select a material for every material component.')
    }
    if (components.some((component) => component.type !== 'Material' &&
      (!component.description?.trim() || !component.unitCode || !Number.isFinite(component.indexedRate) || component.indexedRate < 0))) {
      return setError('Each labour, equipment, and transport component needs a description, unit, and non-negative rate.')
    }
    if (components.some((component) => component.overrideRate?.trim() && (!Number.isFinite(Number(component.overrideRate)) || Number(component.overrideRate) < 0))) {
      return setError('Material override rates must be zero or greater.')
    }

    try {
      const payload = {
        code: code.trim(),
        description: description.trim(),
        unitCode,
        totalWorks: totalWorksNum,
        assumedTimeHours: assumedTimeNum,
        overheadPercent: overheadNum,
        linkedProjectId: linkedProjectId || null,
        remark: remark.trim() || undefined,
        components: components.map<RateComponentInput>((c) => {
          if (c.type === 'Material') {
            return {
              componentType: 'Material',
              materialCode: c.materialCode!,
              quantity: c.quantity,
              utilizationFactor: c.utilizationFactor,
              additionalCost: c.additionalCost ?? 0,
              ...(c.overrideRate?.trim() ? { overrideRate: Number(c.overrideRate) } : {}),
            }
          }
          return {
            componentType: c.type,
            description: c.description!,
            unitCode: c.unitCode,
            quantity: c.quantity,
            utilizationFactor: c.utilizationFactor,
            indexedRate: c.indexedRate,
          }
        }),
      }
      if (id) await update.mutateAsync({ id, payload })
      else await create.mutateAsync(payload)
      navigate(id ? `/rate-analyses/${id}` : '/rate-analyses')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    }
  }

  const grouped = (type: ComponentType) => components.filter((c) => c.type === type)
  const currencyCode = projects.find((project) => project.id === linkedProjectId)?.currencyCode
    ?? components[0]?.currencyCode
    ?? 'ETB'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{id ? 'Edit Rate Analysis' : 'New Rate Analysis'}</h1>
          <p className="text-sm text-gray-500">
            Compose the cost breakdown. Totals calculate live.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(id ? `/rate-analyses/${id}` : '/rate-analyses')}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : id ? 'Save Changes' : 'Save Rate Analysis'}
          </Button>
        </div>
      </div>

      {/* HEADER CARD */}
      <Card>
        <CardHeader>
          <CardTitle>Header</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <div>
            <Label>Code *</Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g., RA-CEM-001"
            />
          </div>
          <div>
            <Label>Unit *</Label>
            <select
              value={unitCode}
              onChange={(e) => setUnitCode(e.target.value)}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              {UNIT_OPTIONS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Total Works *</Label>
            <Input
              type="number" step="0.01"
              value={totalWorks}
              onChange={(e) => setTotalWorks(e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <Label>Description *</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Concrete 25MPa for slab"
            />
          </div>
          <div>
            <Label>Assumed Time (hrs) *</Label>
            <Input
              type="number" step="0.01"
              value={assumedTime}
              onChange={(e) => setAssumedTime(e.target.value)}
            />
          </div>
          <div>
            <Label>Overhead % *</Label>
            <Input
              type="number" step="0.01"
              value={overheadPercent}
              onChange={(e) => setOverheadPercent(e.target.value)}
            />
          </div>
          <div>
            <Label>Performance Rate</Label>
            <Input value={performanceRate.toFixed(2)} readOnly className="bg-gray-50" />
          </div>
        </CardContent>
      </Card>

      {/* PROJECT INFO CARD */}
      <Card>
        <CardHeader>
          <CardTitle>Project Link and Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Linked Project (optional)</Label>
            <select
              value={linkedProjectId}
              onChange={(e) => handleProjectSelect(e.target.value)}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">-- No project (standalone RA) --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Remark</Label>
            <Input value={remark} onChange={(e) => setRemark(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* COMPONENTS */}
      <ComponentSection
        title="Materials (1.01)"
        type="Material"
        components={grouped('Material')}
        materials={materials}
        subtotal={materialTotal}
        currencyCode={currencyCode}
        onAdd={() => addComponent('Material')}
        onUpdate={updateComponent}
        onRemove={removeComponent}
        onMaterialSelect={handleMaterialSelect}
      />

      <ComponentSection
        title="Labour (1.02)"
        type="Labour"
        components={grouped('Labour')}
        subtotal={labourTotal}
        currencyCode={currencyCode}
        onAdd={() => addComponent('Labour')}
        onUpdate={updateComponent}
        onRemove={removeComponent}
      />

      <ComponentSection
        title="Equipment (1.03)"
        type="Equipment"
        components={grouped('Equipment')}
        subtotal={equipmentTotal}
        currencyCode={currencyCode}
        onAdd={() => addComponent('Equipment')}
        onUpdate={updateComponent}
        onRemove={removeComponent}
      />
      <ComponentSection
        title="Transport"
        type="Transport"
        components={grouped('Transport')}
        subtotal={transportTotal}
        currencyCode={currencyCode}
        onAdd={() => addComponent('Transport')}
        onUpdate={updateComponent}
        onRemove={removeComponent}
      />

      {/* LIVE TOTALS */}
      <Card>
        <CardHeader>
          <CardTitle>Live Calculation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <TotalRow label="A = Direct Material Unit Cost" value={directMaterial} suffix={currencyCode} />
          <TotalRow label="B = Direct Man Power Unit Cost" value={directLabour} suffix={currencyCode} />
          <TotalRow label="C = Direct Equipment and Transport Unit Cost" value={directEquipment} suffix={currencyCode} />
          <div className="border-t border-gray-200 pt-2" />
          <TotalRow label="Direct Unit Cost (A + B + C)" value={directUnitCost} bold suffix={currencyCode} />
          <TotalRow label={`Overhead (${overheadNum}%)`} value={overhead} suffix={currencyCode} />
          <div className="border-t border-gray-200 pt-2" />
          <TotalRow label="Total Unit Rate" value={totalRate} bold highlight suffix={`${currencyCode}/${unitCode}`} />
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>
      )}
    </div>
  )
}

// ---------- Sub-components ----------

function ComponentSection({
  title, type, components, materials, subtotal, currencyCode, onAdd, onUpdate, onRemove, onMaterialSelect,
}: {
  title: string
  type: ComponentType
  components: BuilderComponent[]
  materials?: Material[]
  subtotal: number
  currencyCode: string
  onAdd: () => void
  onUpdate: (id: string, patch: Partial<BuilderComponent>) => void
  onRemove: (id: string) => void
  onMaterialSelect?: (id: string, code: string) => void
}) {
  const isMaterial = type === 'Material'
  const isLabour = type === 'Labour'
  const descriptionLabel = isMaterial
    ? 'Material'
    : isLabour
      ? 'Labor by Trade'
      : type === 'Equipment' ? 'Equipment Type' : 'Transport Description'
  const rateLabel = isLabour ? 'Indexed Wage/hr' : type === 'Equipment' ? 'Rental/hr' : 'Rate'
  const helperText = isMaterial
    ? 'Enter the required quantity in the material unit. Additional cost can include transport, loading/unloading, and tax.'
    : isLabour
      ? 'Enter the trade and number of workers. UF adjusts for utilization; indexed wage/hr includes applicable allowances.'
      : type === 'Equipment'
        ? 'Enter the equipment type and number required. UF adjusts for utilization; rental/hr includes rental and related transport costs.'
        : 'Enter the transport description and quantity. UF adjusts for utilization.'

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Button size="sm" variant="outline" onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" /> Add {type}
        </Button>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-xs text-gray-500">{helperText}</p>
        {components.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">
            No {type.toLowerCase()} components. Click "Add {type}" above.
          </p>
        ) : (
          <div className="space-y-2">
            {/* Column headers */}
            <div className="grid grid-cols-12 gap-2 px-2 text-xs font-medium uppercase text-gray-500">
              {isMaterial ? (
                <>
                  <div className="col-span-4">Material</div>
                  <div className="col-span-1 text-center">Qty</div>
                  <div className="col-span-2 text-center">Additional Cost</div>
                  <div className="col-span-2 text-right">Override Rate</div>
                  <div className="col-span-2 text-right">Amount</div>
                  <div className="col-span-1" />
                </>
              ) : (
                <>
                  <div className="col-span-4">{descriptionLabel}</div>
                  <div className="col-span-1 text-center">No.</div>
                  <div className="col-span-1 text-center">UF</div>
                  <div className="col-span-2 text-center">{rateLabel}</div>
                  <div className="col-span-3 text-right">Hourly Cost</div>
                  <div className="col-span-1" />
                </>
              )}
            </div>

            {/* Data rows */}
            {components.map((c) => (
              <div
                key={c.id}
                className="grid grid-cols-12 gap-2 rounded-md border border-gray-200 bg-gray-50 p-2"
              >
                {isMaterial && materials ? (
                  <select
                    value={c.materialCode ?? ''}
                    onChange={(e) => onMaterialSelect?.(c.id, e.target.value)}
                    className="col-span-4 flex h-9 rounded-md border border-gray-300 bg-white px-2 text-sm"
                  >
                    <option value="">-- Select material --</option>
                    {materials.map((m) => (
                      <option key={m.code} value={m.code}>
                        {m.code} — {m.name} ({m.currentRate.amount.toFixed(2)} {m.currentRate.currencyCode}/{m.unitCode})
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    placeholder={descriptionLabel}
                    value={c.description ?? ''}
                    onChange={(e) => onUpdate(c.id, { description: e.target.value })}
                    className="col-span-4 h-9"
                  />
                )}

                <Input
                  type="number" min="0.000001" step="any" placeholder={isMaterial ? 'Qty' : 'No.'}
                  value={c.quantity}
                  onChange={(e) => onUpdate(c.id, { quantity: parseFloat(e.target.value) || 0 })}
                  className="col-span-1 h-9"
                />

                {isMaterial ? (
                  <>
                    <Input
                      type="number" step="0.01" placeholder="Additional Cost"
                      title="Transport, loading/unloading, tax, and other material costs"
                      value={c.additionalCost ?? 0}
                      onChange={(e) => onUpdate(c.id, { additionalCost: parseFloat(e.target.value) || 0 })}
                      className="col-span-2 h-9"
                    />
                    <Input
                      type="number" min="0" step="any"
                      aria-label="Optional material rate override"
                      placeholder={c.indexedRate.toFixed(2)}
                      value={c.overrideRate ?? ''}
                      onChange={(e) => onUpdate(c.id, { overrideRate: e.target.value })}
                      className="col-span-2 h-9"
                    />
                  </>
                ) : (
                  <>
                    <Input
                      type="number" min="0" step="0.001" placeholder="UF"
                      value={c.utilizationFactor}
                      onChange={(e) => onUpdate(c.id, { utilizationFactor: parseFloat(e.target.value) || 0 })}
                      className="col-span-1 h-9"
                    />
                    <Input
                      type="number" min="0" step="any" placeholder={rateLabel}
                      title={isLabour ? 'Hourly wage including applicable allowances' : 'Hourly rental including related transport costs'}
                      value={c.indexedRate}
                      onChange={(e) => onUpdate(c.id, { indexedRate: parseFloat(e.target.value) || 0 })}
                      className="col-span-2 h-9"
                    />
                  </>
                )}

                <div className={`flex items-center justify-end ${isMaterial ? 'col-span-2' : 'col-span-3'}`}>
                  <span className="font-mono text-sm">
                    {(
                      ((isMaterial && c.overrideRate?.trim() ? Number(c.overrideRate) : c.indexedRate) * c.quantity * (isMaterial ? 1 : c.utilizationFactor)) +
                      (isMaterial ? (c.additionalCost ?? 0) : 0)
                    ).toFixed(2)}
                  </span>
                </div>
                <div className="col-span-1 flex items-center justify-end">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onRemove(c.id)}
                    className="h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}

            <div className="flex justify-end pt-2 text-sm font-medium">
              Subtotal: {subtotal.toFixed(2)} {currencyCode}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
function TotalRow({
  label, value, bold, highlight, suffix,
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
      <span className={`font-mono ${bold ? 'font-semibold' : ''} ${highlight ? 'text-brand text-lg' : ''}`}>
        {value.toFixed(2)} {suffix ?? 'ETB'}
      </span>
    </div>
  )
}