import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addBoq,
  createProject,
  deleteBoq,
  deleteProject,
  generateBoqReport,
  getProject,
  listProjects,
  updateBoq,
  updateProject,
  type CreateProjectRequest,
} from '@/api/projects'

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => listProjects(1, 20),
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

export function useUpdateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CreateProjectRequest }) =>
      updateProject(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      qc.invalidateQueries({ queryKey: ['projects', id] })
    },
  })
}

export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })
}

export function useUpdateBoq() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      projectId,
      boqId,
      payload,
    }: {
      projectId: string
      boqId: string
      payload: { title: string; description: string }
    }) => updateBoq(projectId, boqId, payload),
    onSuccess: (_data, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['projects', projectId] })
    },
  })
}

export function useDeleteBoq() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ projectId, boqId }: { projectId: string; boqId: string }) =>
      deleteBoq(projectId, boqId),
    onSuccess: (_data, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['projects', projectId] })
    },
  })
}

export function useGenerateBoqReport() {
  return useMutation({
    mutationFn: ({
      projectId,
      boqId,
      format,
    }: {
      projectId: string
      boqId: string
      format: 'pdf' | 'excel'
    }) => generateBoqReport(projectId, boqId, format),
  })
}