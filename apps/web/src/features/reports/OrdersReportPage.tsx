import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ClipboardList, FileSpreadsheet } from 'lucide-react'
import { MetricCard } from '@/components/MetricCard'
import { PageHeader } from '@/components/PageHeader'
import { getCustomers } from '@/features/customers/customers-service'
import { formatCurrency } from '@/lib/formatters'
import {
  exportOrdersReportExcel,
  getOrdersReport,
} from './orders-report-service'

type ReportFilters = {
  startDate: string
  endDate: string
  status: string
  customerId: string
}

const initialFilters: ReportFilters = {
  startDate: '',
  endDate: '',
  status: '',
  customerId: '',
}

const statusOptions = ['DRAFT', 'PENDING', 'IN_PRODUCTION', 'DONE', 'CANCELED']

export function OrdersReportPage() {
  const [filters, setFilters] = useState<ReportFilters>(initialFilters)
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState('')
  const {
    data: report,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['reports', 'orders', filters],
    queryFn: () => getOrdersReport(filters),
  })
  const {
    data: customers = [],
    isLoading: isLoadingCustomers,
  } = useQuery({
    queryKey: ['customers'],
    queryFn: getCustomers,
  })

  function handleFilterChange(field: keyof ReportFilters, value: string) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [field]: value,
    }))
  }

  async function handleExportExcel() {
    setIsExporting(true)
    setExportError('')

    try {
      const file = await exportOrdersReportExcel(filters)
      const url = window.URL.createObjectURL(file)
      const link = document.createElement('a')

      link.href = url
      link.download = 'relatorio-pedidos.xlsx'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      setExportError('Não foi possível exportar o relatório.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatório de pedidos"
        description="Analise pedidos por período, status e cliente, com resumo financeiro."
        eyebrow="Relatórios"
        icon={ClipboardList}
        actions={
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={isExporting}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-slate-900/20 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
            {isExporting ? 'Exportando...' : 'Exportar Excel'}
          </button>
        }
      />

      {exportError && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {exportError}
        </div>
      )}

      <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm shadow-slate-200/70 ring-1 ring-slate-900/5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_auto] xl:items-end">
          <div>
            <label className="text-sm font-medium text-slate-700">
              Data inicial
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(event) =>
                handleFilterChange('startDate', event.target.value)
              }
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-950"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Data final
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(event) =>
                handleFilterChange('endDate', event.target.value)
              }
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-950"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(event) =>
                handleFilterChange('status', event.target.value)
              }
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-950"
            >
              <option value="">Todos</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {getStatusLabel(status)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Cliente
            </label>
            <select
              value={filters.customerId}
              disabled={isLoadingCustomers}
              onChange={(event) =>
                handleFilterChange('customerId', event.target.value)
              }
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-950 disabled:cursor-not-allowed disabled:bg-slate-100"
            >
              <option value="">Todos</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setFilters(initialFilters)}
            className="cursor-pointer rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Limpar filtros
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="rounded-2xl border border-white/80 bg-white p-6 text-sm text-slate-500 shadow-sm shadow-slate-200/70 ring-1 ring-slate-900/5">
          Carregando relatório...
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-sm">
          Não foi possível carregar o relatório de pedidos.
        </div>
      )}

      {!isLoading && !isError && report && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Pedidos"
              value={String(report.summary.ordersCount)}
              description="Pedidos encontrados"
              icon={ClipboardList}
              tone="blue"
            />
            <MetricCard
              label="Subtotal"
              value={formatCurrency(report.summary.subtotalTotal)}
              description="Soma antes de descontos"
            />
            <MetricCard
              label="Descontos"
              value={formatCurrency(report.summary.discountTotal)}
              description="Total abatido"
              tone="amber"
            />
            <MetricCard
              label="Total geral"
              value={formatCurrency(report.summary.grandTotal)}
              description="Resultado final"
              tone="emerald"
            />
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/80 bg-white shadow-sm shadow-slate-200/70 ring-1 ring-slate-900/5">
            {report.orders.length === 0 ? (
              <div className="p-6 text-sm text-slate-500">
                Nenhum pedido encontrado para os filtros selecionados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                      <th className="px-4 py-3 font-medium">Código</th>
                      <th className="px-4 py-3 font-medium">Cliente</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Subtotal</th>
                      <th className="px-4 py-3 font-medium">Desconto</th>
                      <th className="px-4 py-3 font-medium">Total</th>
                      <th className="px-4 py-3 font-medium">Data</th>
                    </tr>
                  </thead>

                  <tbody>
                    {report.orders.map((order) => (
                      <tr
                        key={order.id}
                        data-status={order.status}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-bold text-blue-800">
                            #{order.code}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {order.customer?.name || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={[
                              'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
                              getStatusBadgeClassName(order.status),
                            ].join(' ')}
                          >
                            {getStatusLabel(order.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {formatCurrency(order.subtotal)}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {formatCurrency(order.discount)}
                        </td>
                        <td
                          className={[
                            'px-4 py-3 text-base font-bold',
                            getOrderTotalClassName(order.status),
                          ].join(' ')}
                        >
                          {formatCurrency(order.total)}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {new Date(order.createdAt).toLocaleDateString(
                            'pt-BR',
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    DRAFT: 'Rascunho',
    PENDING: 'Pendente',
    IN_PRODUCTION: 'Em produção',
    DONE: 'Concluído',
    CANCELED: 'Cancelado',
  }

  return labels[status] ?? status
}

function getStatusBadgeClassName(status: string) {
  const classNames: Record<string, string> = {
    DRAFT: 'border border-slate-200 bg-slate-100 text-slate-700',
    PENDING: 'border border-blue-200 bg-blue-50 text-blue-700',
    IN_PRODUCTION: 'border border-amber-200 bg-amber-50 text-amber-800',
    DONE: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
    CANCELED: 'border border-red-200 bg-red-50 text-red-700',
  }

  return classNames[status] ?? 'border border-slate-200 bg-slate-100 text-slate-700'
}

function getOrderTotalClassName(status: string) {
  const classNames: Record<string, string> = {
    DONE: 'text-emerald-700',
    CANCELED: 'text-red-700',
  }

  return classNames[status] ?? 'text-slate-950'
}
