import { apiClient } from './client'
import type { BoqItemDto } from './projects'

export interface AddBoqItemFromRateAnalysisRequest {
  rateAnalysisId: string
  itemCode: string
  quantity: number
}

export async function addBoqItemFromRateAnalysis(
  projectId: string,
  boqId: string,
  payload: AddBoqItemFromRateAnalysisRequest
): Promise<BoqItemDto> {
  const { data } = await apiClient.post<BoqItemDto>(
    `/Projects/${projectId}/boqs/${boqId}/items/from-rate-analysis`,
    payload
  )
  return data
}