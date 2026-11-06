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
}

export interface RateAnalysisDto {
  id: string
  code: string
  description: string
  unitCode: string
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
}

export interface CreateRateAnalysisRequest {
  code: string
  description: string
  unitCode: string
  totalWorks: number
  assumedTimeHours: number
  overheadPercent: number
  components: RateComponentInput[]
}

export async function createRateAnalysis(payload: CreateRateAnalysisRequest): Promise<RateAnalysisDto> {
  const { data } = await apiClient.post<RateAnalysisDto>('/RateAnalyses', payload)
  return data
}

export async function generateRateAnalysisReport(
  id: string,
  format: 'pdf' | 'excel'
): Promise<{ message: string; jobId: string }> {
  const { data } = await apiClient.post<{ message: string; jobId: string }>(
    `/RateAnalyses/${id}/generate-report`,
    null,
    { params: { format } }
  )
  return data
}