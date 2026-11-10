import { apiClient } from './client'
import type { MoneyDto } from './rateAnalyses'
import { downloadFile, downloadGetFile } from './download'

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

export interface BoqProject {
  id: string
  name: string
  location: string
  client: string
  consultant: string
  contractor: string
  contractorGrade: number
  currencyCode: string
  itemCount: number
  totalDirectCost: number
}

export interface UpdateBoqProjectRequest {
  name: string
  location: string
  client: string
  consultant: string
  contractor: string
  contractorGrade: number
}

export interface BoqProjectSummary {
  totalDirectCost: number
  overheadPercent: number
  overheadAmount: number
  profitPercent: number
  profitAmount: number
  subTotalBeforeVat: number
  vatAmount: number
  grandTotal: number
}

export interface ProjectBoqItem {
  id: string
  itemCode: string
  description: string
  unitCode: string
  quantity: number
  directRate: number
  amount: number
  rateAnalysisId: string
}

export interface BoqItemComponent {
  componentType: 'Material' | 'Labour' | 'Equipment'
  description: string
  unitCode: string
  quantity: number
  utilizationFactor: number
  overtimeFactor: number
  indexedRate: number
  additionalCost: number
}

export interface BoqItemDetail extends ProjectBoqItem {
  projectId: string
  totalWorks: number
  assumedTimeHours: number
  components: BoqItemComponent[]
}

export interface MasterRateAnalysis {
  id: string
  code: string
  description: string
  unitCode: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function unwrapValue(value: unknown): unknown {
  return isRecord(value) && 'value' in value ? value.value : value
}

function extractArray<T>(value: unknown, label: string): T[] {
  const unwrapped = unwrapValue(value)
  if (Array.isArray(unwrapped)) return unwrapped as T[]
  throw new Error(`The API returned an unsupported ${label} response. Expected a list.`)
}

function readProperty(record: Record<string, unknown>, ...names: string[]): unknown {
  for (const name of names) {
    const key = Object.keys(record).find((candidate) => candidate.toLowerCase() === name.toLowerCase())
    if (key) return record[key]
  }
  return undefined
}

function readNumber(record: Record<string, unknown>, ...names: string[]): number {
  const value = readProperty(record, ...names)
  const number = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(number)) {
    throw new Error(`The API response is missing a valid ${names[0]} value.`)
  }
  return number
}

function readOptionalNumber(record: Record<string, unknown>, fallback: number, ...names: string[]): number {
  const value = readProperty(record, ...names)
  if (value == null) return fallback
  const number = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(number)) {
    throw new Error(`The API response contains an invalid ${names[0]} value.`)
  }
  return number
}

function readString(record: Record<string, unknown>, ...names: string[]): string {
  const value = readProperty(record, ...names)
  if (typeof value !== 'string') {
    throw new Error(`The API response is missing a valid ${names[0]} value.`)
  }
  return value
}

function readOptionalString(record: Record<string, unknown>, fallback: string, ...names: string[]): string {
  const value = readProperty(record, ...names)
  if (value == null) return fallback
  if (typeof value !== 'string') {
    throw new Error(`The API response contains an invalid ${names[0]} value.`)
  }
  return value
}

export async function listBoqProjects(): Promise<BoqProject[]> {
  const { data } = await apiClient.get<unknown>('/Boq/projects')
  return extractArray<BoqProject>(data, 'project')
}

function normalizeBoqProject(value: unknown): BoqProject {
  const project = unwrapValue(value)
  if (!isRecord(project)) throw new Error('The API returned an unsupported project response.')
  return {
    id: readString(project, 'id'),
    name: readString(project, 'name'),
    location: readOptionalString(project, '', 'location'),
    client: readOptionalString(project, '', 'client'),
    consultant: readOptionalString(project, '', 'consultant'),
    contractor: readOptionalString(project, '', 'contractor'),
    contractorGrade: readNumber(project, 'contractorGrade'),
    currencyCode: readOptionalString(project, 'ETB', 'currencyCode'),
    itemCount: readNumber(project, 'itemCount'),
    totalDirectCost: readNumber(project, 'totalDirectCost'),
  }
}

export async function getBoqProject(projectId: string): Promise<BoqProject> {
  const { data } = await apiClient.get<unknown>(`/Boq/projects/${projectId}`)
  return normalizeBoqProject(data)
}

export async function updateBoqProject(
  projectId: string,
  payload: UpdateBoqProjectRequest
): Promise<void> {
  await apiClient.put(`/Boq/projects/${projectId}`, payload)
}

export async function deleteBoqProject(projectId: string): Promise<void> {
  await apiClient.delete(`/Boq/projects/${projectId}`)
}

export async function createBoqProject(payload: {
  name: string
  location: string
  client: string
  consultant: string
  contractor: string
  contractorGrade: number
}): Promise<string> {
  const { data } = await apiClient.post<unknown>('/Boq/projects', payload)
  const result = unwrapValue(data)
  if (!isRecord(result)) throw new Error('The API did not return the new project ID.')
  return readString(result, 'projectId', 'id')
}

export async function getBoqProjectSummary(projectId: string): Promise<BoqProjectSummary> {
  const { data } = await apiClient.get<unknown>(`/Boq/projects/${projectId}/summary`)
  const result = unwrapValue(data)
  if (!isRecord(result)) throw new Error('The API returned an unsupported project summary.')
  return {
    totalDirectCost: readNumber(result, 'totalDirectCost'),
    overheadPercent: readNumber(result, 'overheadPercent'),
    overheadAmount: readNumber(result, 'overheadAmount'),
    profitPercent: readNumber(result, 'profitPercent'),
    profitAmount: readNumber(result, 'profitAmount'),
    subTotalBeforeVat: readNumber(result, 'subTotalBeforeVat'),
    vatAmount: readNumber(result, 'vatAmount'),
    grandTotal: readNumber(result, 'grandTotal'),
  }
}

export async function getBoqProjectItems(projectId: string): Promise<ProjectBoqItem[]> {
  const { data } = await apiClient.get<unknown>(`/Boq/projects/${projectId}/items`)
  return extractArray<ProjectBoqItem>(data, 'BOQ item')
}

function normalizeComponent(value: unknown, fallbackUnitCode: string): BoqItemComponent {
  if (!isRecord(value)) throw new Error('The API returned an unsupported BOQ component.')
  const componentType = readString(value, 'componentType')
  const supportedType = (['Material', 'Labour', 'Equipment'] as const)
    .find((candidate) => candidate === componentType)
  if (!supportedType) {
    throw new Error(`Unsupported BOQ component type: ${componentType}`)
  }
  const indexedRate = readProperty(value, 'indexedRate')
  const additionalCost = readProperty(value, 'additionalCost')
  const numericValue = (candidate: unknown, field: string): number => {
    if (candidate == null && field === 'additionalCost') return 0
    const raw = isRecord(candidate) ? readProperty(candidate, 'amount') : candidate
    const number = typeof raw === 'number' ? raw : Number(raw)
    if (!Number.isFinite(number)) throw new Error(`The API returned an invalid component ${field}.`)
    return number
  }
  return {
    componentType: supportedType,
    description: readString(value, 'description'),
    unitCode: readOptionalString(value, fallbackUnitCode, 'unitCode'),
    quantity: readNumber(value, 'quantity'),
    utilizationFactor: readOptionalNumber(value, 1, 'utilizationFactor'),
    overtimeFactor: readOptionalNumber(value, 1, 'overtimeFactor'),
    indexedRate: numericValue(indexedRate, 'indexedRate'),
    additionalCost: numericValue(additionalCost, 'additionalCost'),
  }
}

export async function getBoqItem(itemId: string): Promise<BoqItemDetail> {
  const { data } = await apiClient.get<unknown>(`/Boq/items/${itemId}`)
  const result = unwrapValue(data)
  if (!isRecord(result)) throw new Error('The API returned an unsupported BOQ item.')
  const components = readProperty(result, 'components')
  if (!Array.isArray(components)) throw new Error('The API response does not include BOQ item components.')
  const unitCode = readString(result, 'unitCode')
  const quantity = readNumber(result, 'quantity')
  const directRate = readNumber(result, 'directRate')
  const amountValue = readProperty(result, 'amount', 'newAmount')
  return {
    id: readString(result, 'id'),
    projectId: readString(result, 'projectId'),
    itemCode: readString(result, 'itemCode'),
    description: readString(result, 'description'),
    unitCode,
    quantity,
    directRate,
    amount: amountValue == null ? quantity * directRate : readNumber(result, 'amount', 'newAmount'),
    rateAnalysisId: readString(result, 'rateAnalysisId'),
    totalWorks: readNumber(result, 'totalWorks'),
    assumedTimeHours: readNumber(result, 'assumedTimeHours'),
    components: components.map((component) => normalizeComponent(component, unitCode)),
  }
}

export async function updateBoqItem(itemId: string, payload: {
  quantity: number
  totalWorks: number
  assumedTimeHours: number
  components: BoqItemComponent[]
}): Promise<void> {
  await apiClient.put(`/Boq/items/${itemId}`, payload)
}

export async function deleteBoqWorkflowItem(itemId: string): Promise<void> {
  await apiClient.delete(`/Boq/items/${itemId}`)
}

export async function searchMasterRateAnalyses(search: string, page = 1, size = 20): Promise<MasterRateAnalysis[]> {
  const { data } = await apiClient.get<unknown>('/MasterData/rate-analyses', {
    params: { search, page, size },
  })
  return extractArray<MasterRateAnalysis>(data, 'master rate analysis')
}

export async function addBoqWorkflowItem(payload: {
  projectId: string
  rateAnalysisId: string
  itemCode: string
  description: string
  unitCode: string
  quantity: number
}): Promise<void> {
  await apiClient.post('/Boq/items', payload)
}

export async function downloadBoqProjectReport(projectId: string, format: 'pdf' | 'excel'): Promise<void> {
  const extension = format === 'excel' ? 'xlsx' : 'pdf'
  await downloadGetFile(
    `/Boq/projects/${projectId}/${format}`,
    `boq-project-${projectId}.${extension}`
  )
}
