import { apiClient } from './client'

export interface MasterDataMaterial {
  id: string
  name: string
  unitCode: string
  defaultUnitPrice: number
  defaultAdditionalCost: number
  category: string
}

export interface MasterDataLabor {
  id: string
  trade: string
  dailySalary: number
  hourlySalary: number
  indexedWage: number
}

export interface MasterDataEquipment {
  id: string
  name: string
  rentalRatePerHr: number
  fuelConsumptionPerHr: number
  totalCostPerHr: number
}

export async function listMasterDataMaterials(): Promise<MasterDataMaterial[]> {
  const { data } = await apiClient.get<MasterDataMaterial[]>('/MasterData/materials')
  return data
}

export async function listMasterDataLabors(): Promise<MasterDataLabor[]> {
  const { data } = await apiClient.get<MasterDataLabor[]>('/MasterData/labors')
  return data
}

export async function listMasterDataEquipments(): Promise<MasterDataEquipment[]> {
  const { data } = await apiClient.get<MasterDataEquipment[]>('/MasterData/equipments')
  return data
}
