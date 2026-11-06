import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { useMaterials } from '@/hooks/useMaterials'
import { useCreateRateAnalysis } from '@/hooks/useRateAnalyses'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { RateComponentInput } from '@/api/rateAnalyses'
import type { Material } from '@/api/materials'

const UNIT_OPTIONS = ['m2', 'm3', 'm', 'kg', 'ton', 'ea', 'ls', 'hr', 'day']

type ComponentType = 'Material' | 'Labour' | 'Equipment'

interface BuilderComponent {
  id: string
  type: ComponentType
  materialCode?: string
  description?: string
  unitCode: string
  quantity: number
  utilizationFactor: number
  indexedRate: number
}

function newComponent(type: ComponentType): BuilderComponent {
  return {
    id: crypto.randomUUID(),
    type,
    unitCode: type === 'Material' ? 'm3' : 'hr',
    quantity: type === 'Material' ? 1 : 1,
    utilizationFactor: 1,
    indexedRate: 0,
  }
}

export function RateAnalysisBuilderPage() {
  const navigate = useNavigate()
  const { data: materials = [] } = useMaterials()
  const mutation = useCreateRateAnalysis()

  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [unitCode, setUnitCode] = useState('m2')
  const [totalWorks, setTotalWorks] = useState('1')
  const [assumedTime, setAssumedTime] = useState('8')
  const [overheadPercent, setOverheadPercent] = useState('30')
  const [components, setComponents] = useState<BuilderComponent[]>([])
  const [error, setError] = useState<string | null>(null)

  // ---------- LIVE MATH ----------
  const totalWorksNum = parseFloat(totalWorks) || 0
  const assumedTimeNum = parseFloat(assumedTime) || 0
  const overheadNum = parseFloat(overheadPercent) || 0
  const performanceRate =
    assumedTimeNum > 0 ? totalWorksNum / assumedTimeNum : 0

  const materialTotal = components
    .filter((c) => c.type === 'Material')
    .reduce((sum, c) => sum + c.indexedRate * c.quantity, 0)

  const labourTotal = components
    .filter((c) => c.type === 'Labour')
    .reduce((sum, c) => sum + c.indexedRate * c.quantity * c.utilizationFactor, 0)

  const equipmentTotal = components
    .filter((c) => c.type === 'Equipment')
    .reduce((sum, c) => sum + c.indexedRate * c.quantity * c.utilizationFactor, 0)

  const directMaterial = materialTotal
  const directLabour = performanceRate > 0 ? labourTotal / performanceRate : 0
  const directEquipment = performanceRate > 0 ? equipmentTotal / performanceRate : 0
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

  const handleMaterialSelect = (id: string, code: string) => {
    const mat = materials.find((m) => m.code === code)
    if (!mat) return
    updateComponent(id, {
      materialCode: code,
      description: mat.name,
      unitCode: mat.unitCode,
      indexedRate: mat.currentRate.amount,
    })
  }

  const handleSave = async () => {
    setError(null)

    if (!code.trim()) return setError('Code is required')
    if (!description.trim()) return setError('Description is required')
    if (totalWorksNum <= 0) return setError('Total works must be > 0')
    if (assumedTimeNum <= 0) return setError('Assumed time must be > 0')
    if (components.length === 0) return setError('Add at least one component')

    try {
      await mutation.mutateAsync({
        code: code.trim(),
        description: description.trim(),
        unitCode,
        totalWorks: totalWorksNum,
        assumedTimeHours: assumedTimeNum,
        overheadPercent: overheadNum,
        components: components.map<RateComponentInput>((c) => {
          if (c.type === 'Material') {
            return {
              componentType: 'Material',
              materialCode: c.materialCode!,
              quantity: c.quantity,
              utilizationFactor: c.utilizationFactor,
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
      })
      navigate('/rate-analyses')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    }
  }

  const grouped = (type: ComponentType) => components.filter((c) => c.type === type)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">New Rate Analysis</h1>
          <p className="text-sm text-gray-500">
            Compose the cost breakdown. Totals calculate live.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/rate-analyses')}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : 'Save Rate Analysis'}
          </Button>
        </div>
      </div>

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
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Total Works *</Label>
            <Input
              type="number"
              step="0.01"
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
              type="number"
              step="0.01"
              value={assumedTime}
              onChange={(e) => setAssumedTime(e.target.value)}
            />
          </div>
          <div>
            <Label>Overhead % *</Label>
            <Input
              type="number"
              step="0.01"
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

      {/* MATERIALS */}
      <ComponentSection
        title="Materials (1.01)"
        type="Material"
        components={grouped('Material')}
        materials={materials}
        subtotal={materialTotal}
        onAdd={() => addComponent('Material')}
        onUpdate={updateComponent}
        onRemove={removeComponent}
        onMaterialSelect={handleMaterialSelect}
      />

      {/* LABOUR */}
      <ComponentSection
        title="Labour (1.02)"
        type="Labour"
        components={grouped('Labour')}
        subtotal={labourTotal}
        onAdd={() => addComponent('Labour')}
        onUpdate={updateComponent}
        onRemove={removeComponent}
      />

      {/* EQUIPMENT */}
      <ComponentSection
        title="Equipment (1.03)"
        type="Equipment"
        components={grouped('Equipment')}
        subtotal={equipmentTotal}
        onAdd={() => addComponent('Equipment')}
        onUpdate={updateComponent}
        onRemove={removeComponent}
      />

      {/* LIVE TOTALS */}
      <Card>
        <CardHeader>
          <CardTitle>Live Calculation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <TotalRow label="A = Direct Material Unit Cost" value={directMaterial} />
          <TotalRow label="B = Direct Man Power Unit Cost" value={directLabour} />
          <TotalRow label="C = Direct Equipment Unit Cost" value={directEquipment} />
          <div className="border-t border-gray-200 pt-2" />
          <TotalRow label="Direct Unit Cost (A + B + C)" value={directUnitCost} bold />
          <TotalRow
            label={`Overhead & Profit (${overheadNum}%)`}
            value={overhead}
          />
          <div className="border-t border-gray-200 pt-2" />
          <TotalRow
            label="Total Unit Rate"
            value={totalRate}
            bold
            highlight
            suffix={`ETB/${unitCode}`}
          />
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
  title,
  type,
  components,
  materials,
  subtotal,
  onAdd,
  onUpdate,
  onRemove,
  onMaterialSelect,
}: {
  title: string
  type: ComponentType
  components: BuilderComponent[]
  materials?: Material[]
  subtotal: number
  onAdd: () => void
  onUpdate: (id: string, patch: Partial<BuilderComponent>) => void
  onRemove: (id: string) => void
  onMaterialSelect?: (id: string, code: string) => void
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Button size="sm" variant="outline" onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add {type}
        </Button>
      </CardHeader>
      <CardContent>
        {components.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">
            No {type.toLowerCase()} components. Click "Add {type}" above.
          </p>
        ) : (
          <div className="space-y-2">
            {components.map((c) => (
              <div
                key={c.id}
                className="grid grid-cols-12 gap-2 rounded-md border border-gray-200 bg-gray-50 p-2"
              >
                {type === 'Material' && materials ? (
                  <select
                    value={c.materialCode ?? ''}
                    onChange={(e) => onMaterialSelect?.(c.id, e.target.value)}
                    className="col-span-5 flex h-9 rounded-md border border-gray-300 bg-white px-2 text-sm"
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
                    placeholder="Description"
                    value={c.description ?? ''}
                    onChange={(e) => onUpdate(c.id, { description: e.target.value })}
                    className="col-span-4 h-9"
                  />
                )}

                <Input
                  type="number"
                  step="0.01"
                  placeholder="Qty"
                  value={c.quantity}
                  onChange={(e) => onUpdate(c.id, { quantity: parseFloat(e.target.value) || 0 })}
                  className="col-span-1 h-9"
                />
                <Input
                  type="number"
                  step="0.001"
                  placeholder="UF"
                  value={c.utilizationFactor}
                  onChange={(e) =>
                    onUpdate(c.id, { utilizationFactor: parseFloat(e.target.value) || 0 })
                  }
                  className="col-span-1 h-9"
                />

                {type !== 'Material' ? (
                  <>
                    <Input
                      placeholder="Unit"
                      value={c.unitCode}
                      onChange={(e) => onUpdate(c.id, { unitCode: e.target.value })}
                      className="col-span-1 h-9"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Rate"
                      value={c.indexedRate}
                      onChange={(e) =>
                        onUpdate(c.id, { indexedRate: parseFloat(e.target.value) || 0 })
                      }
                      className="col-span-2 h-9"
                    />
                  </>
                ) : (
                  <div className="col-span-3 flex items-center justify-end pr-2 text-sm text-gray-600">
                    Rate: {c.indexedRate.toFixed(2)}
                  </div>
                )}

                <div className="col-span-2 flex items-center justify-end gap-2">
                  <span className="font-mono text-sm">
                    {(
                      c.indexedRate * c.quantity * (type === 'Material' ? 1 : c.utilizationFactor)
                    ).toFixed(2)}
                  </span>
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
              Subtotal: {subtotal.toFixed(2)} ETB
            </div>
          </div>
        )}
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