import { useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Ban,
  CircleDollarSign,
  ClipboardList,
  Factory,
  LayoutDashboard,
  Package,
  TrendingUp,
  UserCheck,
  Users,
  type LucideIcon,
} from 'lucide-react'
import {
  Bar as RechartsBar,
  BarChart as RechartsBarChart,
  CartesianGrid as RechartsCartesianGrid,
  Cell as RechartsCell,
  Legend as RechartsLegend,
  Pie as RechartsPie,
  PieChart as RechartsPieChart,
  ResponsiveContainer as RechartsResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis as RechartsXAxis,
  YAxis as RechartsYAxis,
} from 'recharts'
import { PageHeader } from '@/components/PageHeader'
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

type SummaryTone = 'slate' | 'blue' | 'amber' | 'emerald' | 'red'

const initialPeriod = getThisMonthPeriod()
const orderStatusChartColors = ['#64748b', '#2563eb', '#f59e0b', '#10b981', '#ef4444']
const financialChartColors = ['#2563eb', '#f59e0b', '#10b981']
const accents: Record<SummaryTone, string> = {
  slate: 'from-slate-400 to-slate-500',
  blue: 'from-blue-500 to-indigo-500',
  amber: 'from-amber-400 to-orange-500',
  emerald: 'from-emerald-400 to-teal-500',
  red: 'from-red-400 to-rose-500',
}

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
    <div className="space-y-7">
      <PageHeader
        title="Dashboard"
        description="Visão geral do desempenho do negócio, pedidos e valores por período."
        eyebrow="Resumo"
        icon={LayoutDashboard}
        actions={
          <div className="rounded-2xl border border-blue-100 bg-white/80 p-3 shadow-sm shadow-blue-100/60">
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
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-700"
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
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-700"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyCustomPeriod}
                  className="cursor-pointer rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition"
                >
                  Aplicar
                </button>
              </div>
            )}
          </div>
        }
      />

      <p className="rounded-full border border-blue-100 bg-white/70 px-4 py-2 text-sm text-slate-600 shadow-sm shadow-blue-100/50">
        Período ativo: <span className="font-semibold">{appliedPeriod.label}</span>
      </p>

      {isLoading && (
        <div className="rounded-2xl border border-white/80 bg-white p-6 text-sm text-slate-500 shadow-sm shadow-slate-200/70 ring-1 ring-slate-900/5">
          Carregando resumo...
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-sm">
          Não foi possível carregar o resumo do dashboard.
        </div>
      )}

      {summary && (
        <div className="space-y-7">
          <DashboardSection title="Pedidos no período">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <SummaryCard
                label="Total de pedidos"
                value={summary.totalOrders}
                description="Todos os status no período"
                icon={ClipboardList}
              />
              <SummaryCard
                label="Em aberto"
                value={summary.openOrders}
                description="Rascunhos e pendentes"
                tone="blue"
                icon={TrendingUp}
              />
              <SummaryCard
                label="Em produção"
                value={summary.productionOrders}
                description="Pedidos em andamento"
                tone="amber"
                icon={Factory}
              />
              <SummaryCard
                label="Concluídos"
                value={summary.doneOrders}
                description="Pedidos finalizados"
                tone="emerald"
                icon={UserCheck}
              />
              <SummaryCard
                label="Cancelados"
                value={summary.canceledOrders}
                description="Pedidos cancelados"
                tone="red"
                icon={Ban}
              />
            </div>
          </DashboardSection>

          <DashboardSection title="Valores no período">
            <div className="grid gap-4 md:grid-cols-3">
              <SummaryCard
                label="Total vendido/concluído"
                value={formatCurrency(summary.totalSoldDone)}
                description="Pedidos concluídos"
                tone="emerald"
                icon={CircleDollarSign}
              />
              <SummaryCard
                label="Total em aberto"
                value={formatCurrency(summary.totalPending)}
                description="Rascunhos e pendentes"
                tone="blue"
                icon={TrendingUp}
              />
              <SummaryCard
                label="Total em produção"
                value={formatCurrency(summary.totalInProduction)}
                description="Pedidos em produção"
                tone="amber"
                icon={Factory}
              />
            </div>
          </DashboardSection>

          <DashboardSection title="Gráficos">
            <div className="grid gap-4 xl:grid-cols-2">
              <ChartCard title="Pedidos por status">
                <RechartsResponsiveContainer width="100%" height={340}>
                  <RechartsBarChart
                    data={orderStatusChartData}
                    margin={{ top: 12, right: 12, left: 0, bottom: 8 }}
                  >
                    <RechartsCartesianGrid
                      stroke="#e2e8f0"
                      strokeDasharray="4 4"
                      vertical={false}
                    />
                    <RechartsXAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      interval={0}
                      height={58}
                    />
                    <RechartsYAxis
                      allowDecimals={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      tickLine={false}
                    />
                    <RechartsTooltip
                      formatter={formatOrdersTooltip}
                      cursor={{ fill: 'rgba(219, 234, 254, 0.42)' }}
                      contentStyle={{
                        borderRadius: '14px',
                        border: '1px solid #bfdbfe',
                        boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12)',
                      }}
                      labelStyle={{ color: '#0f172a', fontWeight: 700 }}
                    />
                    <RechartsBar dataKey="value" radius={[10, 10, 4, 4]} barSize={42}>
                      {orderStatusChartData.map((entry, index) => (
                        <RechartsCell
                          key={entry.name}
                          fill={orderStatusChartColors[index % orderStatusChartColors.length]}
                        />
                      ))}
                    </RechartsBar>
                  </RechartsBarChart>
                </RechartsResponsiveContainer>
              </ChartCard>

              <ChartCard title="Resumo financeiro por situação">
                <RechartsResponsiveContainer width="100%" height={340}>
                  <RechartsPieChart>
                    <RechartsPie
                      data={financialChartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={72}
                      outerRadius={118}
                      paddingAngle={3}
                      stroke="#ffffff"
                      strokeWidth={3}
                    >
                      {financialChartData.map((entry, index) => (
                        <RechartsCell
                          key={entry.name}
                          fill={financialChartColors[index % financialChartColors.length]}
                        />
                      ))}
                    </RechartsPie>
                    <RechartsTooltip
                      formatter={formatFinancialTooltip}
                      contentStyle={{
                        borderRadius: '14px',
                        border: '1px solid #bfdbfe',
                        boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12)',
                      }}
                    />
                    <RechartsLegend
                      iconType="circle"
                      wrapperStyle={{ fontSize: 12, paddingTop: 14 }}
                    />
                  </RechartsPieChart>
                </RechartsResponsiveContainer>
              </ChartCard>
            </div>
          </DashboardSection>

          <DashboardSection title="Clientes gerais">
            <div className="grid gap-4 md:grid-cols-3">
              <SummaryCard
                label="Total de clientes"
                value={summary.totalCustomers}
                description="Base cadastrada"
                icon={Users}
              />
              <SummaryCard
                label="Clientes ativos"
                value={summary.activeCustomers}
                description="Disponíveis para venda"
                tone="emerald"
                icon={UserCheck}
              />
              <SummaryCard
                label="Clientes inativos"
                value={summary.inactiveCustomers}
                description="Cadastros pausados"
              />
            </div>
          </DashboardSection>

          <DashboardSection title="Produtos gerais">
            <div className="grid gap-4 md:grid-cols-3">
              <SummaryCard
                label="Total de produtos"
                value={summary.totalProducts}
                description="Catálogo completo"
                icon={Package}
              />
              <SummaryCard
                label="Produtos ativos"
                value={summary.activeProducts}
                description="Disponíveis para pedido"
                tone="emerald"
                icon={Package}
              />
              <SummaryCard
                label="Produtos inativos"
                value={summary.inactiveProducts}
                description="Itens pausados"
              />
            </div>
          </DashboardSection>
        </div>
      )}
    </div>
  )
}

function DashboardSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section>
      <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
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
    <div className="relative overflow-hidden rounded-3xl border border-white/80 bg-gradient-to-br from-white via-white to-blue-50/40 p-5 shadow-sm shadow-slate-200/70 ring-1 ring-slate-900/5">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <span className="rounded-full border border-blue-100 bg-white/80 px-2.5 py-1 text-xs font-semibold text-blue-700">
          Visão rápida
        </span>
      </div>
      <div className="mt-4 min-h-[340px]">{children}</div>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  description,
  icon: Icon,
  tone = 'slate',
}: {
  label: string
  value: string | number
  description?: string
  icon?: LucideIcon
  tone?: SummaryTone
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/80 bg-white p-5 shadow-sm shadow-slate-200/70 ring-1 ring-slate-900/5 transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-blue-100/70">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accents[tone]}`} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            {value}
          </p>
          {description && (
            <p className="mt-2 text-xs leading-5 text-slate-500">
              {description}
            </p>
          )}
        </div>

        {Icon && (
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${accents[tone]} text-white shadow-sm`}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
        )}
      </div>
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
          ? 'border-blue-700 bg-blue-700 text-white shadow-sm shadow-blue-900/20'
          : 'border-blue-100 bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-900',
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
