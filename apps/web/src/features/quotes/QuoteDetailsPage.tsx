import { useState } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  Calendar,
  CheckCircle,
  CircleDollarSign,
  Clock,
  FileText,
  Hash,
  Link2,
  Pencil,
  Receipt,
  Send,
  Tag,
  User,
  type LucideIcon,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Modal } from '@/components/Modal'
import { useToast } from '@/components/Toast'
import { formatCurrency } from '@/lib/formatters'
import { getApiErrorMessage } from '@/lib/get-api-error-message'
import { QuoteForm } from './QuoteForm'
import type { QuoteFormData } from './quote-schema'
import {
  convertQuoteToOrder,
  downloadQuotePdf,
  getQuote,
  updateQuote,
  updateQuoteStatus,
} from './quotes-service'
import type { Quote, QuoteItem, QuoteStatus } from './types'
import { getQuoteStatusLabel } from './QuotesPage'

const statusOptions: QuoteStatus[] = [
  'DRAFT',
  'SENT',
  'APPROVED',
  'REJECTED',
  'EXPIRED',
]

export function QuoteDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [statusToApply, setStatusToApply] = useState<QuoteStatus | null>(null)
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [pdfError, setPdfError] = useState('')
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const { data: quote, isLoading, isError } = useQuery({
    queryKey: ['quote', id],
    queryFn: () => getQuote(id ?? ''),
    enabled: Boolean(id),
  })
  const updateQuoteMutation = useMutation({
    mutationFn: ({ quoteId, data }: { quoteId: string; data: QuoteFormData }) =>
      updateQuote(quoteId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
      queryClient.invalidateQueries({ queryKey: ['quote', id] })
      setIsEditOpen(false)
    },
  })
  const updateStatusMutation = useMutation({
    mutationFn: ({ quoteId, status }: { quoteId: string; status: QuoteStatus }) =>
      updateQuoteStatus(quoteId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
      queryClient.invalidateQueries({ queryKey: ['quote', id] })
      setStatusToApply(null)
    },
  })
  const convertMutation = useMutation({
    mutationFn: convertQuoteToOrder,
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order', order.id] })
      showToast('Orçamento convertido em pedido com sucesso.')
      setIsConvertDialogOpen(false)
      navigate(`/orders/${order.id}`)
    },
    onError: (error) => {
      showToast(
        getApiErrorMessage(
          error,
          'Não foi possível converter este orçamento em pedido.',
        ),
        'error',
      )
    },
  })

  async function handleGeneratePdf() {
    if (!quote) return
    setIsGeneratingPdf(true)
    setPdfError('')

    try {
      const file = await downloadQuotePdf(quote.id)
      const url = window.URL.createObjectURL(file)
      const link = document.createElement('a')
      link.href = url
      link.download = `orcamento-${quote.code}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      setPdfError('Não foi possível gerar o PDF do orçamento.')
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  if (isLoading) {
    return <div className="text-sm text-slate-500">Carregando orçamento...</div>
  }

  if (isError || !quote) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Não foi possível carregar os detalhes do orçamento.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-indigo-50 p-6 shadow-sm shadow-blue-100/70 ring-1 ring-blue-900/5">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400" />
        <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to="/quotes"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Voltar para orçamentos
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              Orçamento #{quote.code}
            </h1>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            Detalhes, itens e valores calculados.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleGeneratePdf}
            disabled={isGeneratingPdf}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FileText className="h-4 w-4" aria-hidden="true" />
            {isGeneratingPdf ? 'Gerando...' : 'Gerar PDF'}
          </button>

          <button
            type="button"
            onClick={() => setIsEditOpen(true)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Editar
          </button>

          {statusOptions
            .filter((status) => status !== quote.status)
            .map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => {
                  updateStatusMutation.reset()
                  setStatusToApply(status)
                }}
                title={`Alterar para ${getQuoteStatusLabel(status)}`}
                aria-label={`Alterar para ${getQuoteStatusLabel(status)}`}
                className="cursor-pointer rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                {getQuoteStatusLabel(status)}
              </button>
            ))}
        </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <HighlightStat
            label="Cliente"
            value={quote.customer?.name || '-'}
            icon={User}
            description={quote.customer?.phone || undefined}
            tone="blue"
          />
          <HighlightStat
            label="Status"
            value={getQuoteStatusLabel(quote.status)}
            status={quote.status}
            icon={getQuoteStatusIcon(quote.status)}
          />
          <HighlightStat
            label="Total geral"
            value={formatCurrency(quote.total)}
            accent
            icon={CircleDollarSign}
          />
        </div>

        <section className="mt-4 rounded-2xl border border-white/80 bg-white/72 p-4 shadow-sm shadow-blue-100/50">
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
            Dados gerais
          </h2>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <DetailItem
              label="Subtotal"
              value={formatCurrency(quote.subtotal)}
              icon={Receipt}
              tone="blue"
            />
            <DetailItem
              label="Desconto"
              value={formatCurrency(quote.discount)}
              icon={Tag}
              tone="rose"
            />
            <DetailItem label="Código" value={`#${quote.code}`} icon={Hash} tone="indigo" />
            <DetailItem
              label="Criado em"
              value={new Date(quote.createdAt).toLocaleString('pt-BR')}
              icon={Calendar}
              tone="slate"
            />
            <DetailItem
              label="Validade"
              value={
                quote.validUntil
                  ? new Date(quote.validUntil).toLocaleDateString('pt-BR')
                  : '-'
              }
              icon={Clock}
              tone="cyan"
            />
          </dl>
        </section>

        {quote.order && (
          <section className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-emerald-900 shadow-sm shadow-emerald-100/70">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <Link2 className="h-4 w-4" aria-hidden="true" />
                </span>
                <p className="text-sm">
                  <span className="font-semibold">
                    Pedido gerado: #{quote.order.code}
                  </span>
                </p>
              </div>

              <Link
                to={`/orders/${quote.order.id}`}
                className="cursor-pointer rounded-xl bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-800"
              >
                Ver pedido
              </Link>
            </div>
          </section>
        )}
      </div>

      {['REJECTED', 'EXPIRED'].includes(quote.status) && (
        <section
          className={[
            'flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-sm',
            quote.status === 'EXPIRED'
              ? 'border-purple-200 bg-purple-50 text-purple-800 shadow-purple-100/70'
              : 'border-red-200 bg-red-50 text-red-800 shadow-red-100/70',
          ].join(' ')}
        >
          <span
            className={[
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
              quote.status === 'EXPIRED'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-red-100 text-red-700',
            ].join(' ')}
          >
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">
              {quote.status === 'EXPIRED'
                ? 'Este orçamento está expirado'
                : 'Este orçamento foi recusado'}
            </h2>
            <p
              className={[
                'mt-0.5 text-xs sm:text-sm',
                quote.status === 'EXPIRED' ? 'text-purple-700' : 'text-red-700',
              ].join(' ')}
            >
              O orçamento permanece disponível para consulta, PDF e histórico.
            </p>
          </div>
        </section>
      )}

      {pdfError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {pdfError}
        </div>
      )}

      {quote.status === 'APPROVED' && (
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-5 shadow-sm shadow-emerald-100/70">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-emerald-950">
                Orçamento aprovado
              </h2>
              <p className="mt-1 text-sm text-emerald-800">
                Converta este orçamento em pedido quando estiver pronto.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                convertMutation.reset()
                setIsConvertDialogOpen(true)
              }}
              disabled={convertMutation.isPending}
              className="cursor-pointer rounded-xl bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {convertMutation.isPending
                ? 'Convertendo...'
                : 'Converter em pedido'}
            </button>
          </div>

          {convertMutation.isError && (
            <p className="mt-3 text-sm text-red-700">
              {getApiErrorMessage(
                convertMutation.error,
                'Não foi possível converter este orçamento.',
              )}
            </p>
          )}
        </section>
      )}

      {quote.notes && (
        <section className="rounded-2xl border border-white/80 bg-white p-6 shadow-sm shadow-slate-200/70 ring-1 ring-slate-900/5">
          <h2 className="text-lg font-semibold text-slate-900">Observações</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {quote.notes}
          </p>
        </section>
      )}

      <section className="overflow-hidden rounded-3xl border border-white/80 bg-white shadow-sm shadow-slate-200/70 ring-1 ring-slate-900/5">
        <div className="border-b border-blue-100 bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/60 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 shadow-sm shadow-blue-100/70">
                <Receipt className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Itens do orçamento
                </h2>
                <p className="text-sm text-slate-500">
                  Produtos, variações e valores da proposta.
                </p>
              </div>
            </div>
            <span className="rounded-full border border-blue-100 bg-white/85 px-3 py-1 text-xs font-semibold text-blue-700 shadow-sm shadow-blue-100/50">
              {quote.items.length} {quote.items.length === 1 ? 'item' : 'itens'}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="px-4 py-3 font-medium">Produto</th>
                <th className="px-4 py-3 font-medium">Variação</th>
                <th className="px-4 py-3 font-medium">Quantidade</th>
                <th className="px-4 py-3 font-medium">Valor unitário</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Observações</th>
              </tr>
            </thead>
            <tbody>
              {quote.items.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {item.product?.name || '-'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatVariant(item)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{item.quantity}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {formatCurrency(item.total)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {item.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end border-t border-blue-100 bg-gradient-to-r from-white to-blue-50/50 p-5">
          <div className="w-full max-w-md rounded-2xl border border-blue-100 bg-white/90 p-5 text-sm shadow-sm shadow-blue-100/60">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <CircleDollarSign className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-semibold text-slate-900">
                  Resumo financeiro
                </h3>
                <p className="text-xs text-slate-500">
                  Totais da proposta
                </p>
              </div>
            </div>
            <SummaryRow label="Subtotal" value={formatCurrency(quote.subtotal)} />
            <SummaryRow label="Desconto" value={formatCurrency(quote.discount)} />
            <SummaryRow label="Total geral" value={formatCurrency(quote.total)} strong />
          </div>
        </div>
      </section>

      <Modal
        open={isEditOpen}
        title="Editar orçamento"
        description={`Orçamento #${quote.code}. Os valores serão recalculados pelo backend ao salvar.`}
        maxWidthClassName="max-w-5xl"
        onClose={() => setIsEditOpen(false)}
      >
        {updateQuoteMutation.isError && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            Não foi possível salvar as alterações do orçamento.
          </div>
        )}
        <QuoteForm
          initialData={quote}
          onSubmit={(data) => updateQuoteMutation.mutate({ quoteId: quote.id, data })}
          isSubmitting={updateQuoteMutation.isPending}
          submitButtonText="Salvar alterações"
          onCancel={() => setIsEditOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(statusToApply)}
        title="Alterar status"
        description={
          statusToApply
            ? `Deseja alterar o orçamento #${quote.code} para ${getQuoteStatusLabel(statusToApply)}?`
            : ''
        }
        confirmLabel="Alterar status"
        cancelLabel="Cancelar"
        isLoading={updateStatusMutation.isPending}
        errorMessage={
          updateStatusMutation.isError
            ? getApiErrorMessage(
                updateStatusMutation.error,
                'Não foi possível alterar o status do orçamento.',
              )
            : undefined
        }
        onConfirm={() =>
          statusToApply &&
          updateStatusMutation.mutate({ quoteId: quote.id, status: statusToApply })
        }
        onCancel={() => setStatusToApply(null)}
      />

      <ConfirmDialog
        open={isConvertDialogOpen}
        title="Converter em pedido"
        description={`Deseja converter o orçamento #${quote.code} em pedido? Se ele já tiver sido convertido, você será levado ao pedido existente.`}
        confirmLabel="Converter"
        cancelLabel="Cancelar"
        isLoading={convertMutation.isPending}
        errorMessage={
          convertMutation.isError
            ? getApiErrorMessage(
                convertMutation.error,
                'Não foi possível converter este orçamento em pedido.',
              )
            : undefined
        }
        onConfirm={() => convertMutation.mutate(quote.id)}
        onCancel={() => {
          convertMutation.reset()
          setIsConvertDialogOpen(false)
        }}
      />
    </div>
  )
}

function HighlightStat({
  label,
  value,
  description,
  accent,
  status,
  icon: Icon,
  tone,
}: {
  label: string
  value: string
  description?: string
  accent?: boolean
  status?: string
  icon?: LucideIcon
  tone?: 'blue'
}) {
  const statusClassName = status ? getQuoteStatusStatClassName(status) : ''

  return (
    <div
      className={[
        'relative overflow-hidden rounded-2xl border p-4 shadow-sm',
        accent
          ? 'border-blue-200 bg-gradient-to-br from-blue-700 to-indigo-700 text-white shadow-blue-900/20'
          : statusClassName ||
            (tone === 'blue'
              ? 'border-blue-100 bg-gradient-to-br from-white to-blue-50/90 text-slate-900 shadow-blue-100/70'
              : 'border-white/80 bg-white/75 text-slate-900 shadow-blue-100/50'),
      ].join(' ')}
    >
      {tone === 'blue' && (
        <div className="absolute inset-y-0 left-0 w-1 bg-blue-500/60" />
      )}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className={[
              'text-xs font-semibold uppercase tracking-[0.14em]',
              accent ? 'text-blue-100' : status ? 'text-current opacity-70' : 'text-slate-500',
            ].join(' ')}
          >
            {label}
          </p>
          <p className="mt-1 text-lg font-bold">{value}</p>
          {description && (
            <p className="mt-1 text-xs font-medium text-slate-500">
              {description}
            </p>
          )}
        </div>
        {Icon && (
          <span
            className={[
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
              accent
                ? 'bg-white/15 text-white'
                : status
                  ? 'bg-white/65 text-current'
                  : 'bg-blue-50 text-blue-700',
            ].join(' ')}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
        )}
      </div>
    </div>
  )
}

function getQuoteStatusStatClassName(status: string) {
  const classNames: Record<string, string> = {
    DRAFT:
      'border-slate-300 bg-gradient-to-br from-slate-100 to-slate-50 text-slate-800 shadow-slate-200/70',
    SENT:
      'border-blue-300 bg-gradient-to-br from-blue-100 to-blue-50 text-blue-900 shadow-blue-100/70',
    APPROVED:
      'border-emerald-300 bg-gradient-to-br from-emerald-100 to-teal-50 text-emerald-900 shadow-emerald-100/70',
    REJECTED:
      'border-red-300 bg-gradient-to-br from-red-100 to-rose-50 text-red-900 shadow-red-100/70',
    EXPIRED:
      'border-purple-300 bg-gradient-to-br from-purple-100 to-violet-50 text-purple-900 shadow-purple-100/70',
  }

  return classNames[status] ?? classNames.DRAFT
}

function getQuoteStatusIcon(status: string) {
  const icons: Record<string, LucideIcon> = {
    DRAFT: Clock,
    SENT: Send,
    APPROVED: CheckCircle,
    REJECTED: Ban,
    EXPIRED: AlertTriangle,
  }

  return icons[status] ?? Clock
}

function DetailItem({
  label,
  value,
  accent,
  icon: Icon,
  tone = 'blue',
}: {
  label: string
  value: string
  accent?: boolean
  icon?: LucideIcon
  tone?: 'blue' | 'rose' | 'indigo' | 'slate' | 'cyan'
}) {
  const toneClassName = getDetailToneClassName(tone)

  return (
    <div
      className={[
        'rounded-2xl border px-4 py-3 shadow-sm',
        accent
          ? 'border-blue-100 bg-blue-50/70 shadow-blue-100/50'
          : toneClassName.container,
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        {Icon && (
          <span
            className={[
              'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
              toneClassName.icon,
            ].join(' ')}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        )}
        <div>
          <dt className="text-xs font-medium uppercase text-slate-500">{label}</dt>
          <dd
            className={[
              'mt-1 text-sm font-medium',
              accent ? 'text-base font-bold text-blue-900' : 'text-slate-900',
            ].join(' ')}
          >
            {value}
          </dd>
        </div>
      </div>
    </div>
  )
}

function getDetailToneClassName(tone: 'blue' | 'rose' | 'indigo' | 'slate' | 'cyan') {
  const classNames = {
    blue: {
      container: 'border-blue-100 bg-blue-50/55 shadow-blue-100/50',
      icon: 'bg-blue-100 text-blue-700',
    },
    rose: {
      container: 'border-rose-100 bg-rose-50/55 shadow-rose-100/50',
      icon: 'bg-rose-100 text-rose-700',
    },
    indigo: {
      container: 'border-indigo-100 bg-indigo-50/55 shadow-indigo-100/50',
      icon: 'bg-indigo-100 text-indigo-700',
    },
    slate: {
      container: 'border-slate-100 bg-slate-50/80 shadow-slate-100/60',
      icon: 'bg-slate-100 text-slate-600',
    },
    cyan: {
      container: 'border-cyan-100 bg-cyan-50/55 shadow-cyan-100/50',
      icon: 'bg-cyan-100 text-cyan-700',
    },
  }

  return classNames[tone]
}

function SummaryRow({
  label,
  value,
  strong,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div
      className={[
        'flex items-center justify-between gap-4',
        strong
          ? 'mt-3 rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-700 px-4 py-3 text-white shadow-sm shadow-blue-900/20'
          : 'border-b border-slate-100 py-2 last:border-b-0',
      ].join(' ')}
    >
      <span className={strong ? 'text-blue-100' : 'text-slate-500'}>
        {label}
      </span>
      <span className={strong ? 'text-lg font-bold text-white' : 'text-slate-700'}>
        {value}
      </span>
    </div>
  )
}

function formatVariant(item: QuoteItem) {
  const variant = item.productVariant
  if (!variant) return '-'
  const parts = [variant.size, variant.color, variant.type, variant.material]
    .filter(Boolean)
    .join(' / ')
  return parts || '-'
}
