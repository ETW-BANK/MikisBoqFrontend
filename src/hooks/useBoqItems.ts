import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  addBoqItemFromRateAnalysis,
  type AddBoqItemFromRateAnalysisRequest,
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