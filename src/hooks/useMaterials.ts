import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createMaterial, listMaterials, type CreateMaterialRequest } from '@/api/materials'

export function useMaterials() {
  return useQuery({
    queryKey: ['materials'],
    queryFn: listMaterials,
  })
}

export function useCreateMaterial() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateMaterialRequest) => createMaterial(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
    },
  })
}