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
  components: RateComponentDto[]
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

function extractRateAnalysis(response: unknown): RateAnalysisDto {
  if (isRecord(response) && 'value' in response) {
    if (response.isFailure === true || response.isSuccess === false) {
      const message = typeof response.error === 'string' && response.error.trim()
        ? response.error
        : 'The API could not retrieve the rate analysis.'
      throw new Error(message)
    }
    response = response.value
  }

  if (!isRateAnalysisDto(response)) {
    throw new Error('The API returned a rate analysis in an unsupported format.')
  }
  return response
}

function extractRateAnalysisList(response: unknown): RateAnalysisDto[] {
  let list: unknown[] | undefined
  if (Array.isArray(response)) list = response
  if (typeof response === 'object' && response !== null) {
    const body = response as Record<string, unknown>
    for (const key of ['items', 'data', 'results', 'value', '$values', 'rateAnalyses']) {
      if (Array.isArray(body[key])) {
        list = body[key]
        break
      }
    }
  }

  if (!list) {
    throw new Error('The API returned rate analyses in an unsupported format. Expected a list of rate analyses.')
  }
  if (!list.every(isRateAnalysisDto)) {
    throw new Error('The API returned one or more rate analyses with an unsupported format.')
  }
  return list
}

export async function listRateAnalyses(): Promise<RateAnalysisDto[]> {
  const { data } = await apiClient.get<unknown>('/RateAnalyses')
  return extractRateAnalysisList(data)
}

export async function getRateAnalysis(id: string): Promise<RateAnalysisDto> {
  const { data } = await apiClient.get<unknown>(`/RateAnalyses/${id}`)
  return extractRateAnalysis(data)
}

export interface RateComponentInput {
  componentType: string
  description?: string
  unitCode?: string
  quantity: number
  utilizationFactor: number
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
  const { data } = await apiClient.post<unknown>('/RateAnalyses', payload)
  return extractRateAnalysis(data)
}

export async function updateRateAnalysis(
  id: string,
  payload: CreateRateAnalysisRequest
): Promise<RateAnalysisDto> {
  const { data } = await apiClient.put<unknown>(`/RateAnalyses/${id}`, payload)
  return extractRateAnalysis(data)
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