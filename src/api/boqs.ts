import { apiClient } from './client'
import type { BoqItemDto } from './projects'

export interface AddBoqItemFromRateAnalysisRequest {
  rateAnalysisId: string
  itemCode: string
  quantity: number
}

export interface ManualBoqItemRequest {
  itemCode: string
  description: string
  unitCode: string
  quantity: number
  rateAmount: number
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

export async function addManualBoqItem(
  projectId: string,
  boqId: string,
  payload: ManualBoqItemRequest
): Promise<BoqItemDto> {
  const { data } = await apiClient.post<BoqItemDto>(
    `/Projects/${projectId}/boqs/${boqId}/items`,
    payload
  )
  return data
}

export async function updateBoqItem(
  projectId: string,
  boqId: string,
  itemId: string,
  payload: ManualBoqItemRequest
): Promise<BoqItemDto> {
  const { data } = await apiClient.put<BoqItemDto>(
    `/Projects/${projectId}/boqs/${boqId}/items/${itemId}`,
    payload
  )
  return data
}

export async function deleteBoqItem(projectId: string, boqId: string, itemId: string): Promise<void> {
  await apiClient.delete(`/Projects/${projectId}/boqs/${boqId}/items/${itemId}`)
}
