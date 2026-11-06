import { apiClient } from './client'

export interface Material {
  id: string
  code: string
  name: string
  description: string
  unitCode: string
  currentRate: { amount: number; currencyCode: string }
  isActive: boolean
}

export async function listMaterials(): Promise<Material[]> {
  const { data } = await apiClient.get<Material[]>('/Materials')
  return data
}

export interface CreateMaterialRequest {
  code?: string
  name: string
  description?: string
  unitCode: string
  rateAmount: number
  currencyCode: string
}

export async function createMaterial(payload: CreateMaterialRequest): Promise<Material> {
  const { data } = await apiClient.post<Material>('/Materials', payload)
  return data
}