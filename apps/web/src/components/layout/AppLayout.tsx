import { NavLink, Outlet } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Boxes,
  ClipboardList,
  FileSignature,
  FileText,
  Home,
  Package,
  Settings,
  Tags,
  Users,
} from 'lucide-react'
import { getCompanySettings } from '@/features/settings/company-settings-service'

const navItems = [
  {
    title: 'Dashboard',
    href: '/',
    icon: Home,
  },
  {
    title: 'Clientes',
    href: '/customers',
    icon: Users,
  },
  {
    title: 'Produtos',
    href: '/products',
    icon: Package,
  },
  {
    title: 'Categorias',
    href: '/categories',
    icon: Tags,
  },
  {
    title: 'Pedidos',
    href: '/orders',
    icon: ClipboardList,
  },
  {
    title: 'Orçamentos',
    href: '/quotes',
    icon: FileSignature,
  },
  {
    title: 'Relatório de pedidos',
    href: '/reports/orders',
    icon: FileText,
  },
  {
    title: 'Configurações',
    href: '/settings/company',
    icon: Settings,
  },
]

export function AppLayout() {
  const { data: companySettings } = useQuery({
    queryKey: ['company-settings'],
    queryFn: getCompanySettings,
  })
  const companyName = companySettings?.name?.trim() || 'Sistema Nexus'

  return (
    <div className="min-h-screen text-slate-950">
      <aside className="brand-sidebar fixed inset-y-0 left-0 z-10 hidden w-64 border-r bg-white/88 shadow-xl backdrop-blur lg:block">
        <div className="flex h-16 items-center gap-3 border-b border-slate-200/80 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-lg shadow-brand">
            <Boxes size={20} />
          </div>

          <div>
            <strong className="block leading-none text-slate-950">Nexus</strong>
            <span className="text-xs text-slate-500">Gestão de pedidos</span>
          </div>
        </div>

        <nav className="space-y-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === '/'}
                className={({ isActive }: { isActive: boolean }) =>
                  [
                    'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition',
                    isActive
                      ? 'brand-nav-active'
                      : 'brand-nav-idle text-slate-600',
                  ].join(' ')
                }
              >
                <Icon size={18} />
                {item.title}
              </NavLink>
            )
          })}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-white/70 bg-white/75 px-6 shadow-sm shadow-slate-200/50 backdrop-blur">
          <div>
            <span className="text-sm font-medium text-slate-500">
              {companyName}
            </span>
          </div>

          <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
            Ambiente local
          </div>
        </header>

        <main className="mx-auto w-full max-w-screen-2xl p-4 sm:p-6 lg:p-8 2xl:max-w-[1760px]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
