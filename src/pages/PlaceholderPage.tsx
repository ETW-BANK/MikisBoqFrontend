export function PlaceholderPage({ title, phase }: { title: string; phase: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
        <p className="mt-2 text-gray-500">This screen is coming in {phase}.</p>
      </div>
    </div>
  )
}