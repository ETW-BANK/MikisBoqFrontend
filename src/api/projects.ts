import { apiClient } from './client'
import type { MoneyDto } from './rateAnalyses'
import { downloadFile } from './download'

export interface BoqItemDto {
  id: string
  rateAnalysisId: string | null
  itemCode: string
  description: string
  unitCode: string
  quantity: number
  rate: MoneyDto
  total: MoneyDto
}

export interface BoqDto {
  id: string
  title: string
  description: string
  items: BoqItemDto[]
  total: MoneyDto
}

export interface ProjectDto {
  id: string
  code: string
  name: string
  clientId: string
  currencyCode: string
  status: string
  overheadPercent: number
  profitPercent: number
  contingencyPercent: number
  ownerId: string
  location: string
  client: string
  consultant: string
  contractor: string
  createdAtUtc: string
  boqs: BoqDto[]
}

export async function listProjects(page = 1, size = 20): Promise<ProjectDto[]> {
  const { data } = await apiClient.get<ProjectDto[]>('/Projects', { params: { page, size } })
  return data
}

export async function getProject(id: string): Promise<ProjectDto> {
  const { data } = await apiClient.get<ProjectDto>(`/Projects/${id}`)
  return data
}

export interface CreateProjectRequest {
  code?: string
  name: string
  clientId?: string
  currencyCode: string
  overheadPercent: number
  profitPercent: number
  contingencyPercent: number
  ownerId?: string
  location: string
  client: string
  consultant: string
  contractor: string
}

export interface UpdateProjectRequest extends Omit<CreateProjectRequest, 'clientId' | 'ownerId'> {
  clientId: string
}

export async function createProject(payload: CreateProjectRequest): Promise<ProjectDto> {
  const { data } = await apiClient.post<ProjectDto>('/Projects', payload)
  return data
}

export async function updateProject(id: string, payload: UpdateProjectRequest): Promise<ProjectDto> {
  const { data } = await apiClient.put<ProjectDto>(`/Projects/${id}`, { ...payload, id })
  return data
}

export async function deleteProject(id: string): Promise<void> {
  await apiClient.delete(`/Projects/${id}`)
}

export async function addBoq(
  projectId: string,
  payload: { title: string; description: string }
): Promise<BoqDto> {
  const { data } = await apiClient.post<BoqDto>(`/Projects/${projectId}/boqs`, payload)
  return data
}

export async function updateBoq(
  projectId: string,
  boqId: string,
  payload: { title: string; description: string }
): Promise<BoqDto> {
  const { data } = await apiClient.put<BoqDto>(`/Projects/${projectId}/boqs/${boqId}`, payload)
  return data
}

export async function deleteBoq(projectId: string, boqId: string): Promise<void> {
  await apiClient.delete(`/Projects/${projectId}/boqs/${boqId}`)
}

export async function generateBoqReport(
  projectId: string,
  boqId: string,
  format: 'pdf' | 'excel'
): Promise<void> {
  await downloadFile(
    `/Projects/${projectId}/boqs/${boqId}/generate-report`,
    format,
    format === 'pdf' ? `boq-${boqId}.pdf` : `boq-${boqId}.xlsx`
  )
}
