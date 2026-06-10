import { NavLink, Outlet } from 'react-router-dom'
import {
  Boxes,
  ClipboardList,
  FileText,
  FileSignature,
  Home,
  Package,
  Settings,
  Tags,
  Users,
} from 'lucide-react'

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
  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 border-r border-slate-200 bg-white lg:block">
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
            <Boxes size={20} />
          </div>

          <div>
            <strong className="block leading-none">Nexus</strong>
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
                      ? 'bg-slate-950 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
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
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
          <div>
            <span className="text-sm font-medium text-slate-500">
              Sistema Nexus
            </span>
          </div>

          <div className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
            Ambiente local
          </div>
        </header>

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
