import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addBoq,
  createProject,
  generateBoqReport,
  getProject,
  listProjects,
  type CreateProjectRequest,
} from '@/api/projects'

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: listProjects,
  })
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => getProject(id!),
    enabled: !!id,
  })
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateProjectRequest) => createProject(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useAddBoq() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      projectId,
      payload,
    }: {
      projectId: string
      payload: { title: string; description: string }
    }) => addBoq(projectId, payload),
    onSuccess: (_data, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['projects', projectId] })
    },
  })
}

export function useGenerateBoqReport() {
  return useMutation({
    mutationFn: ({ projectId, boqId }: { projectId: string; boqId: string }) =>
      generateBoqReport(projectId, boqId),
  })
}