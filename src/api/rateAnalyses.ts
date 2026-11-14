import { apiClient } from './client'

export interface MoneyDto {
  amount: number
  currencyCode: string
}

export interface RateComponentDto {
  componentType: string
  description: string
  unitCode: string
  quantity: number
  utilizationFactor: number
  indexedRate: MoneyDto
  amount: MoneyDto
  materialCode: string | null
  additionalCost: MoneyDto | null
}

export interface RateAnalysisDto {
  id: string
  linkedProjectId: string | null
  code: string
  description: string
  unitCode: string
  remark: string | null
  totalWorksToBeExecuted: number
  assumedTimeInHours: number
  performanceRatePerHour: number
  directMaterialUnitCost: MoneyDto
  directLabourUnitCost: MoneyDto
  directEquipmentUnitCost: MoneyDto
  directUnitCost: MoneyDto
  overheadAndProfit: MoneyDto
  totalUnitRate: MoneyDto
  hasCalculatedTotals?: boolean
  components: RateComponentDto[]
}

export interface RateAnalysisListItem {
  id: string
  code: string
  description: string
  unitCode: string
}

export interface RateAnalysisPage {
  items: RateAnalysisListItem[]
  totalCount: number
  page: number
  size: number
  totalPages: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

// 1. LIST RATE ANALYSES (Uses the raw array and paginates locally)
export async function listRateAnalyses(page = 1, size = 20, search = ''): Promise<RateAnalysisPage> {
  // We fetch ALL items matching the search (the DB has ~822 items, which is small enough to handle client-side)
  const { data } = await apiClient.get<unknown>('/MasterData/rate-analyses', {
    params: { search, page: 1, size: 2000 }, // Fetch all
  })

  if (!Array.isArray(data)) {
    throw new Error('The API returned an unsupported rate-analysis response. Expected a list.')
  }

  const allItems = data as RateAnalysisListItem[]
  
  // Now we paginate in memory
  const totalCount = allItems.length
  const totalPages = Math.ceil(totalCount / size)
  const startIndex = (page - 1) * size
  const paginatedItems = allItems.slice(startIndex, startIndex + size)

  return {
    items: paginatedItems,
    totalCount,
    page,
    size,
    totalPages: totalPages === 0 ? 1 : totalPages,
  }
}

// 2. GET SINGLE RATE ANALYSIS
export async function getRateAnalysis(id: string): Promise<RateAnalysisDto> {
  const { data } = await apiClient.get<unknown>(`/Boq/rate-analyses/${id}`)
  
  if (!isRecord(data) || !Array.isArray(data.components)) {
    throw new Error('The API returned a rate analysis in an unsupported format.')
  }

  const readString = (record: Record<string, unknown>, key: string, fallback = ''): string => {
    const value = record[key] ?? record[key[0].toUpperCase() + key.slice(1)]
    return typeof value === 'string' ? value : fallback
  }
  const readNumber = (record: Record<string, unknown>, key: string, fallback = 0): number => {
    const value = record[key] ?? record[key[0].toUpperCase() + key.slice(1)]
    const number = typeof value === 'number' ? value : Number(value)
    return Number.isFinite(number) ? number : fallback
  }
  
  const unitCode = readString(data, 'unitCode')
  const money = (amount: number): MoneyDto => ({ amount, currencyCode: 'ETB' })

  const components = data.components.map((component): RateComponentDto => {
    if (!isRecord(component)) throw new Error('The API returned an invalid rate-analysis component.')
    const componentType = readString(component, 'componentType')
    const description = readString(component, 'description')
    const componentUnitCode = readString(component, 'unitCode', unitCode)
    const quantity = readNumber(component, 'quantity')
    const utilizationFactor = readNumber(component, 'utilizationFactor', 1)
    
    // In the new backend, indexedRate and additionalCost are just numbers, not MoneyDto objects
    const indexedRateAmount = readNumber(component, 'indexedRate')
    const additionalCostAmount = readNumber(component, 'additionalCost')
    
    return {
      componentType,
      description,
      unitCode: componentUnitCode,
      quantity,
      utilizationFactor,
      indexedRate: money(indexedRateAmount),
      amount: money(indexedRateAmount * quantity * utilizationFactor),
      materialCode: typeof component.materialCode === 'string' ? component.materialCode : null,
      additionalCost: money(additionalCostAmount),
    }
  })

  const totalWorksToBeExecuted = readNumber(data, 'totalWorks', 1)
  const assumedTimeInHours = readNumber(data, 'assumedTimeHours', 1)
  const performanceRatePerHour = assumedTimeInHours > 0 ? totalWorksToBeExecuted / assumedTimeInHours : 0
  const zero = money(0)

  return {
    id: readString(data, 'id', id),
    linkedProjectId: null,
    code: readString(data, 'code'),
    description: readString(data, 'description'),
    unitCode,
    remark: null,
    totalWorksToBeExecuted,
    assumedTimeInHours,
    performanceRatePerHour,
    directMaterialUnitCost: zero,
    directLabourUnitCost: zero,
    directEquipmentUnitCost: zero,
    directUnitCost: zero,
    overheadAndProfit: zero,
    totalUnitRate: zero,
    hasCalculatedTotals: false,
    components,
  }
}

export interface RateComponentInput {
  componentType: string
  description?: string
  unitCode?: string
  quantity: number
  utilizationFactor: number
  overtimeFactor?: number
  indexedRate?: number
  materialCode?: string
  overrideRate?: number
  additionalCost?: number
}

export interface CreateRateAnalysisRequest {
  code: string
  description: string
  unitCode: string
  totalWorks: number
  assumedTimeHours: number
  overheadPercent: number
  linkedProjectId?: string | null
  remark?: string
  components: RateComponentInput[]
}

export async function createRateAnalysis(payload: CreateRateAnalysisRequest): Promise<RateAnalysisDto> {
  void payload
  throw new Error('The live API does not provide an endpoint to create rate analyses yet.')
}

export async function updateRateAnalysis(
  id: string,
  payload: CreateRateAnalysisRequest
): Promise<RateAnalysisDto> {
  await apiClient.put(`/MasterData/rate-analyses/${id}`, {
    rateAnalysisId: id,
    totalWorks: payload.totalWorks,
    assumedTimeHours: payload.assumedTimeHours,
    components: payload.components.map((component) => ({
      componentType: component.componentType,
      description: component.description ?? '',
      unitCode: component.unitCode ?? '',
      quantity: component.quantity,
      utilizationFactor: component.utilizationFactor,
      overtimeFactor: component.overtimeFactor ?? 1,
      indexedRate: component.indexedRate ?? 0,
      additionalCost: component.additionalCost ?? 0,
    })),
  })
  return getRateAnalysis(id)
}