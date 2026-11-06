export function ErrorMessage({ error }: { error: unknown }) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
      ? error
      : 'An unexpected error occurred.'

  return (
    <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <p className="font-medium">Error</p>
      <p className="mt-1">{message}</p>
    </div>
  )
}