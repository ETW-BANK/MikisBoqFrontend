import { apiClient } from './client'
import type { MoneyDto } from './rateAnalyses'

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
  createdAtUtc: string
  boqs: BoqDto[]
}

export async function listProjects(): Promise<ProjectDto[]> {
  const { data } = await apiClient.get<ProjectDto[]>('/Projects')
  return data
}

export async function getProject(id: string): Promise<ProjectDto> {
  const { data } = await apiClient.get<ProjectDto>(`/Projects/${id}`)
  return data
}

export interface CreateProjectRequest {
  code: string
  name: string
  clientId: string
  currencyCode: string
  overheadPercent: number
  profitPercent: number
  contingencyPercent: number
  ownerId: string
}

export async function createProject(payload: CreateProjectRequest): Promise<ProjectDto> {
  const { data } = await apiClient.post<ProjectDto>('/Projects', payload)
  return data
}

export async function addBoq(
  projectId: string,
  payload: { title: string; description: string }
): Promise<BoqDto> {
  const { data } = await apiClient.post<BoqDto>(`/Projects/${projectId}/boqs`, payload)
  return data
}

export async function generateBoqReport(projectId: string, boqId: string) {
  const { data } = await apiClient.post<{ message: string; jobId: string }>(
    `/Projects/${projectId}/boqs/${boqId}/generate-report`
  )
  return data
}