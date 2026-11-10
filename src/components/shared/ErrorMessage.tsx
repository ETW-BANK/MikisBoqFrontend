import axios from 'axios'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data: unknown = error.response?.data
    if (typeof data === 'string' && data.trim()) return data
    if (isRecord(data)) {
      for (const key of ['error', 'message', 'title', 'detail']) {
        const value = data[key]
        if (typeof value === 'string' && value.trim()) return value
      }
    }
    return error.message
  }
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'An unexpected error occurred.'
}

export function ErrorMessage({ error }: { error: unknown }) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <p className="font-medium">Error</p>
      <p className="mt-1">{getMessage(error)}</p>
    </div>
  )
}