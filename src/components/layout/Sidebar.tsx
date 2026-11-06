import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Package, TrendingUp, FolderKanban } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/materials', label: 'Materials', icon: Package },
  { to: '/rate-analyses', label: 'Rate Analyses', icon: TrendingUp },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
]

export function Sidebar() {
  return (
    <aside className="w-64 border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 p-6">
        <h1 className="text-xl font-bold text-brand">🏢 Mikis BoQ</h1>
        <p className="mt-1 text-xs text-gray-500">Estimating Platform</p>
      </div>

      <nav className="space-y-1 p-4">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}