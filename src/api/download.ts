import axios from 'axios'
import { apiClient } from './client'

function getFilename(contentDisposition: string | undefined, fallback: string): string {
  if (!contentDisposition) return fallback
  const encoded = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
  if (encoded) {
    try {
      return decodeURIComponent(encoded.replace(/^"|"$/g, ''))
    } catch {
      return fallback
    }
  }
  const plain = contentDisposition.match(/filename="?([^";]+)"?/i)?.[1]
  return plain || fallback
}

async function getErrorMessage(errorData: Blob): Promise<string> {
  const text = await errorData.text()
  try {
    const body: unknown = JSON.parse(text)
    if (typeof body === 'object' && body !== null && 'message' in body &&
      typeof body.message === 'string') return body.message
    if (typeof body === 'object' && body !== null && 'title' in body &&
      typeof body.title === 'string') return body.title
    if (typeof body === 'object' && body !== null && 'detail' in body &&
      typeof body.detail === 'string') return body.detail
  } catch {
    return text || 'The server could not generate the requested file.'
  }
  return text || 'The server could not generate the requested file.'
}

export async function downloadFile(
  path: string,
  format: 'pdf' | 'excel',
  fallbackFilename: string
): Promise<void> {
  let response
  try {
    response = await apiClient.post<Blob>(path, null, {
      params: { format },
      responseType: 'blob',
    })
  } catch (error) {
    if (axios.isAxiosError<Blob>(error) && error.response?.data instanceof Blob) {
      throw new Error(await getErrorMessage(error.response.data), { cause: error })
    }
    throw error
  }
  const contentType = response.headers['content-type'] as string | undefined
  if (contentType?.includes('json') || contentType?.includes('text/')) {
    throw new Error(await getErrorMessage(response.data))
  }

  const filename = getFilename(response.headers['content-disposition'] as string | undefined, fallbackFilename)
  const url = URL.createObjectURL(response.data)
  try {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
  }
}
