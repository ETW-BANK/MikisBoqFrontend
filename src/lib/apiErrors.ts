import axios from 'axios'

function problemDetailsMessage(data: unknown): string | null {
  if (typeof data === 'string') return data.trim() || null
  if (typeof data !== 'object' || data === null) return null

  const record = data as Record<string, unknown>
  const messages: string[] = []
  for (const key of ['detail', 'message', 'title']) {
    if (typeof record[key] === 'string' && record[key].trim()) messages.push(record[key].trim())
  }

  const errors = record.errors
  if (typeof errors === 'object' && errors !== null) {
    for (const [field, value] of Object.entries(errors)) {
      if (typeof value === 'string' && value.trim()) messages.push(`${field}: ${value.trim()}`)
      else if (Array.isArray(value)) {
        for (const message of value) {
          if (typeof message === 'string' && message.trim()) messages.push(`${field}: ${message.trim()}`)
        }
      }
    }
  }

  return messages.length > 0 ? [...new Set(messages)].join(' ') : null
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const responseMessage = problemDetailsMessage(error.response?.data)
    if (responseMessage) return responseMessage
    if (error.response?.status) return `${fallback} (HTTP ${error.response.status})`
  }
  return error instanceof Error ? error.message : fallback
}
