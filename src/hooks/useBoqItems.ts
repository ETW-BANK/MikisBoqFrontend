import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  addManualBoqItem,
  addBoqItemFromRateAnalysis,
  deleteBoqItem,
  updateBoqItem,
  type AddBoqItemFromRateAnalysisRequest,
  type ManualBoqItemRequest,
} from '@/api/boqs'

export function useAddBoqItemFromRateAnalysis() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      projectId,
      boqId,
      payload,
    }: {
      projectId: string
      boqId: string
      payload: AddBoqItemFromRateAnalysisRequest
    }) => addBoqItemFromRateAnalysis(projectId, boqId, payload),
    onSuccess: (_data, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['projects', projectId] })
    },
  })
}

export function useAddManualBoqItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      projectId,
      boqId,
      payload,
    }: {
      projectId: string
      boqId: string
      payload: ManualBoqItemRequest
    }) => addManualBoqItem(projectId, boqId, payload),
    onSuccess: (_data, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['projects', projectId] })
    },
  })
}

export function useUpdateBoqItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      projectId,
      boqId,
      itemId,
      payload,
    }: {
      projectId: string
      boqId: string
      itemId: string
      payload: ManualBoqItemRequest
    }) => updateBoqItem(projectId, boqId, itemId, payload),
    onSuccess: (_data, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['projects', projectId] })
    },
  })
}

export function useDeleteBoqItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      projectId,
      boqId,
      itemId,
    }: {
      projectId: string
      boqId: string
      itemId: string
    }) => deleteBoqItem(projectId, boqId, itemId),
    onSuccess: (_data, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['projects', projectId] })
    },
  })
}