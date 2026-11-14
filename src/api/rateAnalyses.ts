import { apiClient } from './client'
import { downloadFile } from './download'

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
  additionalCost: MoneyDto | null      // NEW
}

export interface RateAnalysisDto {
  id: string
  linkedProjectId: string | null       // NEW
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

function isMoneyDto(value: unknown): value is MoneyDto {
  return isRecord(value) &&
    typeof value.amount === 'number' &&
    typeof value.currencyCode === 'string'
}

function isRateComponentDto(value: unknown): value is RateComponentDto {
  return isRecord(value) &&
    typeof value.componentType === 'string' &&
    typeof value.description === 'string' &&
    typeof value.unitCode === 'string' &&
    typeof value.quantity === 'number' &&
    typeof value.utilizationFactor === 'number' &&
    isMoneyDto(value.indexedRate) &&
    isMoneyDto(value.amount) &&
    (typeof value.materialCode === 'string' || value.materialCode === null) &&
    (isMoneyDto(value.additionalCost) || value.additionalCost === null)
}

function isRateAnalysisDto(value: unknown): value is RateAnalysisDto {
  return isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.code === 'string' &&
    typeof value.description === 'string' &&
    typeof value.unitCode === 'string' &&
    (typeof value.linkedProjectId === 'string' || value.linkedProjectId === null) &&
    (typeof value.remark === 'string' || value.remark === null) &&
    typeof value.totalWorksToBeExecuted === 'number' &&
    typeof value.assumedTimeInHours === 'number' &&
    typeof value.performanceRatePerHour === 'number' &&
    Array.isArray(value.components) &&
    value.components.every(isRateComponentDto) &&
    isMoneyDto(value.directMaterialUnitCost) &&
    isMoneyDto(value.directLabourUnitCost) &&
    isMoneyDto(value.directEquipmentUnitCost) &&
    isMoneyDto(value.directUnitCost) &&
    isMoneyDto(value.overheadAndProfit) &&
    isMoneyDto(value.totalUnitRate)
}

export async function listRateAnalyses(page = 1, size = 20): Promise<RateAnalysisPage> {
  const { data } = await apiClient.get<unknown>('/MasterData/rate-analyses', {
    params: { page, size },
  })
  return extractRateAnalysisListItems(data)
}

function extractRateAnalysisListItems(response: unknown): RateAnalysisPage {
  if (!isRecord(response) || !Array.isArray(response.items)) {
    throw new Error('The API returned an unsupported rate-analysis page response.')
  }
  const { items, totalCount, page, size, totalPages } = response
  if (
    typeof totalCount !== 'number' ||
    typeof page !== 'number' ||
    typeof size !== 'number' ||
    typeof totalPages !== 'number'
  ) {
    throw new Error('The API returned incomplete rate-analysis pagination information.')
  }
  return {
    items: items.map((item) => {
    if (!isRecord(item) ||
      typeof item.id !== 'string' ||
      typeof item.code !== 'string' ||
      typeof item.description !== 'string' ||
      typeof item.unitCode !== 'string') {
      throw new Error('The API returned a rate analysis with an unsupported format.')
    }
    return {
      id: item.id,
      code: item.code,
      description: item.description,
      unitCode: item.unitCode,
    }
    }),
    totalCount,
    page,
    size,
    totalPages,
  }
}

export async function getRateAnalysis(id: string): Promise<RateAnalysisDto> {
  const { data } = await apiClient.get<unknown>(`/Boq/rate-analyses/${id}`)
  if (isRateAnalysisDto(data)) return data
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
  const components = data.components.map((component): RateComponentDto => {
    if (!isRecord(component)) throw new Error('The API returned an invalid rate-analysis component.')
    const componentType = readString(component, 'componentType')
    const description = readString(component, 'description')
    const componentUnitCode = readString(component, 'unitCode', unitCode)
    const quantity = readNumber(component, 'quantity')
    const utilizationFactor = readNumber(component, 'utilizationFactor', 1)
    const rateValue = component.indexedRate ?? component.IndexedRate
    const indexedRateAmount = isRecord(rateValue)
      ? readNumber(rateValue, 'amount')
      : typeof rateValue === 'number' ? rateValue : Number(rateValue) || 0
    const additionalCostValue = component.additionalCost ?? component.AdditionalCost
    const additionalCostAmount = isRecord(additionalCostValue)
      ? readNumber(additionalCostValue, 'amount')
      : typeof additionalCostValue === 'number' ? additionalCostValue : Number(additionalCostValue) || 0
    const money = (amount: number): MoneyDto => ({ amount, currencyCode: 'ETB' })
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
  const performanceRatePerHour = assumedTimeInHours > 0
    ? totalWorksToBeExecuted / assumedTimeInHours
    : 0
  const zero = { amount: 0, currencyCode: 'ETB' }
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
  additionalCost?: number               // NEW
}

export interface CreateRateAnalysisRequest {
  code: string
  description: string
  unitCode: string
  totalWorks: number
  assumedTimeHours: number
  overheadPercent: number
  linkedProjectId?: string | null        // NEW
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

export async function deleteRateAnalysis(id: string): Promise<void> {
  await apiClient.delete(`/RateAnalyses/${id}`)
}

export async function generateRateAnalysisReport(id: string, format: 'pdf' | 'excel'): Promise<void> {
  await downloadFile(
    `/RateAnalyses/${id}/generate-report`,
    format,
    `rate-analysis-${id}.${format === 'excel' ? 'xlsx' : 'pdf'}`
  )
}