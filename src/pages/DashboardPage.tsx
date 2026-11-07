import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Package, TrendingUp, FolderKanban } from 'lucide-react'
import { listRateAnalyses } from '@/api/rateAnalyses'
import { listProjects } from '@/api/projects'
import { listMaterials } from '@/api/materials'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)

  const { data: rateAnalyses = [] } = useQuery({
    queryKey: ['rate-analyses'],
    queryFn: listRateAnalyses,
  })
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => listProjects(),
  })
  const { data: materials = [] } = useQuery({
    queryKey: ['materials'],
    queryFn: listMaterials,
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {user?.name ?? 'User'} 👋</h1>
        <p className="mt-1 text-gray-600">Here's an overview of your estimating workspace.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Rate Analyses"
          value={rateAnalyses.length}
          icon={TrendingUp}
          to="/rate-analyses"
        />
        <StatCard label="Projects" value={projects.length} icon={FolderKanban} to="/projects" />
        <StatCard label="Materials" value={materials.length} icon={Package} to="/materials" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link to="/rate-analyses">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Rate Analysis
            </Button>
          </Link>
          <Link to="/projects">
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </Link>
          <Link to="/materials">
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              New Material
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  to,
}: {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  to: string
}) {
  return (
    <Link to={to}>
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="flex items-center justify-between pt-6">
          <div>
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className="mt-1 text-3xl font-bold">{value}</p>
          </div>
          <Icon className="h-10 w-10 text-brand" />
        </CardContent>
      </Card>
    </Link>
  )
}