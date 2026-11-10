import { NavLink } from 'react-router-dom'
import { FolderKanban } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Sidebar() {
  return (
    <aside className="w-64 border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 p-6">
        <h1 className="text-xl font-bold text-brand">Mikis BoQ</h1>
        <p className="mt-1 text-xs text-gray-500">Local estimating workspace</p>
      </div>
      <nav className="space-y-1 p-4">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive ? 'bg-brand text-white' : 'text-gray-700 hover:bg-gray-100'
            )
          }
        >
          <FolderKanban className="h-4 w-4" />
          Projects
        </NavLink>
      </nav>
    </aside>
  )
}
