import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createRateAnalysis,
  getRateAnalysis,
  listRateAnalyses,
  generateRateAnalysisReport,
  type CreateRateAnalysisRequest,
} from '@/api/rateAnalyses'

export function useRateAnalyses() {
  return useQuery({
    queryKey: ['rate-analyses'],
    queryFn: listRateAnalyses,
  })
}

export function useRateAnalysis(id: string | undefined) {
  return useQuery({
    queryKey: ['rate-analyses', id],
    queryFn: () => getRateAnalysis(id!),
    enabled: !!id,
  })
}

export function useCreateRateAnalysis() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateRateAnalysisRequest) => createRateAnalysis(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rate-analyses'] })
    },
  })
}

export function useGenerateReport() {
  return useMutation({
    mutationFn: ({ id, format }: { id: string; format: 'pdf' | 'excel' }) =>
      generateRateAnalysisReport(id, format),
  })
}