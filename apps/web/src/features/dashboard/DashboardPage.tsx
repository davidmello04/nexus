import { useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCurrency } from '@/lib/formatters'
import {
  getDashboardSummary,
  type DashboardSummaryFilters,
} from './dashboard-service'

type PeriodMode = 'today' | 'thisMonth' | 'lastMonth' | 'custom'

type AppliedPeriod = DashboardSummaryFilters & {
  label: string
  mode: PeriodMode
}

const initialPeriod = getThisMonthPeriod()
const chartColors = ['#64748b', '#f59e0b', '#2563eb', '#10b981', '#ef4444']

export function DashboardPage() {
  const [periodMode, setPeriodMode] = useState<PeriodMode>(initialPeriod.mode)
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [appliedPeriod, setAppliedPeriod] =
    useState<AppliedPeriod>(initialPeriod)
  const {
    data: summary,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [
      'dashboard-summary',
      appliedPeriod.startDate,
      appliedPeriod.endDate,
    ],
    queryFn: () => getDashboardSummary(appliedPeriod),
  })
  const orderStatusChartData = summary
    ? [
        { name: 'Rascunho', value: summary.draftOrders },
        { name: 'Pendente', value: summary.pendingOrders },
        { name: 'Em produção', value: summary.inProductionOrders },
        { name: 'Concluído', value: summary.doneOrders },
        { name: 'Cancelado', value: summary.canceledOrders },
      ]
    : []
  const financialChartData = summary
    ? [
        { name: 'Em aberto', value: summary.totalPending },
        { name: 'Em produção', value: summary.totalInProduction },
        { name: 'Concluído', value: summary.totalSoldDone },
      ]
    : []

  function handleApplyPreset(mode: Exclude<PeriodMode, 'custom'>) {
    const period = getPeriodByMode(mode)
    setPeriodMode(mode)
    setAppliedPeriod(period)
  }

  function handleApplyCustomPeriod() {
    setPeriodMode('custom')
    setAppliedPeriod({
      mode: 'custom',
      startDate: customStartDate || undefined,
      endDate: customEndDate || undefined,
      label: formatCustomPeriodLabel(customStartDate, customEndDate),
    })
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-2 text-sm text-slate-500">Visão geral do Nexus.</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap gap-2">
            <PeriodButton
              active={periodMode === 'today'}
              onClick={() => handleApplyPreset('today')}
            >
              Hoje
            </PeriodButton>
            <PeriodButton
              active={periodMode === 'thisMonth'}
              onClick={() => handleApplyPreset('thisMonth')}
            >
              Este mês
            </PeriodButton>
            <PeriodButton
              active={periodMode === 'lastMonth'}
              onClick={() => handleApplyPreset('lastMonth')}
            >
              Mês passado
            </PeriodButton>
            <PeriodButton
              active={periodMode === 'custom'}
              onClick={() => setPeriodMode('custom')}
            >
              Personalizado
            </PeriodButton>
          </div>

          {periodMode === 'custom' && (
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <div>
                <label className="text-xs font-medium text-slate-600">
                  Data inicial
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(event) => setCustomStartDate(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">
                  Data final
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(event) => setCustomEndDate(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
                />
              </div>
              <button
                type="button"
                onClick={handleApplyCustomPeriod}
                className="cursor-pointer rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Aplicar
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="mt-4 text-sm text-slate-500">
        Período ativo: <span className="font-medium">{appliedPeriod.label}</span>
      </p>

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
            <h2 className="text-sm font-semibold text-slate-900">
              Pedidos no período
            </h2>
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
            <h2 className="text-sm font-semibold text-slate-900">
              Valores no período
            </h2>
            <div className="mt-3 grid gap-4 md:grid-cols-3">
              <SummaryCard
                label="Total vendido/concluído"
                value={formatCurrency(summary.totalSoldDone)}
              />
              <SummaryCard
                label="Total em aberto"
                value={formatCurrency(summary.totalPending)}
              />
              <SummaryCard
                label="Total em produção"
                value={formatCurrency(summary.totalInProduction)}
              />
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-slate-900">Gráficos</h2>
            <div className="mt-3 grid gap-4 xl:grid-cols-2">
              <ChartCard title="Pedidos por status">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={orderStatusChartData}
                    margin={{ top: 12, right: 12, left: 0, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      interval={0}
                      height={58}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={formatOrdersTooltip} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {orderStatusChartData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={chartColors[index % chartColors.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Resumo financeiro por situação">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={financialChartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={64}
                      outerRadius={104}
                      paddingAngle={3}
                      label={({ name }) => name}
                    >
                      {financialChartData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={chartColors[index % chartColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={formatFinancialTooltip} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-slate-900">
              Clientes gerais
            </h2>
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
            <h2 className="text-sm font-semibold text-slate-900">
              Produtos gerais
            </h2>
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

function ChartCard({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <div className="mt-4 min-h-[300px]">{children}</div>
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

function formatOrdersTooltip(value: unknown) {
  return [Number(value), 'Pedidos']
}

function formatFinancialTooltip(value: unknown) {
  return [formatCurrency(Number(value)), 'Valor']
}

function PeriodButton({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'cursor-pointer rounded-xl border px-3 py-2 text-sm font-medium transition',
        active
          ? 'border-slate-950 bg-slate-950 text-white'
          : 'border-slate-300 text-slate-700 hover:bg-slate-50',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function getPeriodByMode(mode: Exclude<PeriodMode, 'custom'>): AppliedPeriod {
  if (mode === 'today') {
    const today = formatDateInput(new Date())

    return {
      mode,
      startDate: today,
      endDate: today,
      label: 'Hoje',
    }
  }

  if (mode === 'lastMonth') {
    const today = new Date()
    const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const endDate = new Date(today.getFullYear(), today.getMonth(), 0)

    return {
      mode,
      startDate: formatDateInput(startDate),
      endDate: formatDateInput(endDate),
      label: 'Mês passado',
    }
  }

  return getThisMonthPeriod()
}

function getThisMonthPeriod(): AppliedPeriod {
  const today = new Date()
  const startDate = new Date(today.getFullYear(), today.getMonth(), 1)
  const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)

  return {
    mode: 'thisMonth',
    startDate: formatDateInput(startDate),
    endDate: formatDateInput(endDate),
    label: 'Este mês',
  }
}

function formatDateInput(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatCustomPeriodLabel(startDate?: string, endDate?: string) {
  if (startDate && endDate) {
    return `${formatDisplayDate(startDate)} até ${formatDisplayDate(endDate)}`
  }

  if (startDate) {
    return `A partir de ${formatDisplayDate(startDate)}`
  }

  if (endDate) {
    return `Até ${formatDisplayDate(endDate)}`
  }

  return 'Todo o período'
}

function formatDisplayDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR')
}
