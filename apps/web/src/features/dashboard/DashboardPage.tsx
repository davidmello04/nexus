import { useQuery } from '@tanstack/react-query'
import { formatCurrency } from '@/lib/formatters'
import { getDashboardSummary } from './dashboard-service'

export function DashboardPage() {
  const {
    data: summary,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: getDashboardSummary,
  })

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      <p className="mt-2 text-sm text-slate-500">Visão geral do Nexus.</p>

      {isLoading && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Carregando resumo...
        </div>
      )}

      {isError && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          Não foi possível carregar o resumo do dashboard.
        </div>
      )}

      {summary && (
        <div className="mt-6 space-y-6">
          <section>
            <h2 className="text-sm font-semibold text-slate-900">Pedidos</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <SummaryCard label="Total de pedidos" value={summary.totalOrders} />
              <SummaryCard label="Em aberto" value={summary.openOrders} />
              <SummaryCard
                label="Em produção"
                value={summary.productionOrders}
              />
              <SummaryCard label="Concluídos" value={summary.doneOrders} />
              <SummaryCard label="Cancelados" value={summary.canceledOrders} />
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-slate-900">Valores</h2>
            <div className="mt-3 grid gap-4 md:grid-cols-3">
              <SummaryCard
                label="Total vendido/concluído"
                value={formatCurrency(summary.totalSoldDone)}
              />
              <SummaryCard
                label="Total pendente"
                value={formatCurrency(summary.totalPending)}
              />
              <SummaryCard
                label="Total em produção"
                value={formatCurrency(summary.totalInProduction)}
              />
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-slate-900">Clientes</h2>
            <div className="mt-3 grid gap-4 md:grid-cols-3">
              <SummaryCard label="Total de clientes" value={summary.totalCustomers} />
              <SummaryCard label="Clientes ativos" value={summary.activeCustomers} />
              <SummaryCard
                label="Clientes inativos"
                value={summary.inactiveCustomers}
              />
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-slate-900">Produtos</h2>
            <div className="mt-3 grid gap-4 md:grid-cols-3">
              <SummaryCard label="Total de produtos" value={summary.totalProducts} />
              <SummaryCard label="Produtos ativos" value={summary.activeProducts} />
              <SummaryCard
                label="Produtos inativos"
                value={summary.inactiveProducts}
              />
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

function SummaryCard({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  )
}
