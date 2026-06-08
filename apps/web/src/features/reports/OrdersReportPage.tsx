import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
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
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Relatório de pedidos
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Analise pedidos por período, status e cliente.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportExcel}
          disabled={isExporting}
          className="cursor-pointer rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isExporting ? 'Exportando...' : 'Exportar Excel'}
        </button>
      </div>

      {exportError && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {exportError}
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
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
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Carregando relatório...
        </div>
      )}

      {isError && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          Não foi possível carregar o relatório de pedidos.
        </div>
      )}

      {!isLoading && !isError && report && (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="Pedidos"
              value={String(report.summary.ordersCount)}
            />
            <SummaryCard
              label="Subtotal"
              value={formatCurrency(report.summary.subtotalTotal)}
            />
            <SummaryCard
              label="Descontos"
              value={formatCurrency(report.summary.discountTotal)}
            />
            <SummaryCard
              label="Total geral"
              value={formatCurrency(report.summary.grandTotal)}
            />
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white">
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
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="px-4 py-3 font-medium text-slate-900">
                          #{order.code}
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
                        <td className="px-4 py-3 font-medium text-slate-900">
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

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <strong className="mt-2 block text-2xl font-bold text-slate-950">
        {value}
      </strong>
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
    DRAFT: 'bg-slate-100 text-slate-700',
    PENDING: 'bg-amber-100 text-amber-800',
    IN_PRODUCTION: 'bg-blue-100 text-blue-800',
    DONE: 'bg-emerald-100 text-emerald-800',
    CANCELED: 'bg-red-100 text-red-700',
  }

  return classNames[status] ?? 'bg-slate-100 text-slate-700'
}
