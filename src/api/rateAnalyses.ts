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
  remark: string
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

export async function listRateAnalyses(): Promise<RateAnalysisDto[]> {
  const { data } = await apiClient.get<RateAnalysisDto[]>('/RateAnalyses')
  return data
}

export async function getRateAnalysis(id: string): Promise<RateAnalysisDto> {
  const { data } = await apiClient.get<RateAnalysisDto>(`/RateAnalyses/${id}`)
  return data
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
  const { data } = await apiClient.post<RateAnalysisDto>('/RateAnalyses', payload)
  return data
}

export async function updateRateAnalysis(
  id: string,
  payload: CreateRateAnalysisRequest
): Promise<RateAnalysisDto> {
  const { data } = await apiClient.put<RateAnalysisDto>(`/RateAnalyses/${id}`, payload)
  return data
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