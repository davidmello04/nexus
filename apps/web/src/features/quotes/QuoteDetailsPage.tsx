import { useState } from 'react'
import { ArrowLeft, FileText, Pencil } from 'lucide-react'
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
import { getQuoteStatusLabel, StatusBadge } from './QuotesPage'

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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to="/quotes"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Voltar para orçamentos
          </Link>
          <h1 className="mt-3 text-2xl font-bold tracking-tight">
            Orçamento #{quote.code}
          </h1>
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
        </div>
      </div>

      {pdfError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {pdfError}
        </div>
      )}

      {quote.order && (
        <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-blue-950">
                Pedido gerado: #{quote.order.code}
              </h2>
              <p className="mt-1 text-sm text-blue-800">
                Este orçamento já foi convertido em pedido.
              </p>
            </div>

            <Link
              to={`/orders/${quote.order.id}`}
              className="cursor-pointer rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-800"
            >
              Ver pedido
            </Link>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Dados gerais
            </h2>
            <div className="mt-3">
              <StatusBadge status={quote.status} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
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
                  className="cursor-pointer rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  {getQuoteStatusLabel(status)}
                </button>
              ))}
          </div>
        </div>

        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DetailItem label="Cliente" value={quote.customer?.name || '-'} />
          <DetailItem
            label="Criado em"
            value={new Date(quote.createdAt).toLocaleString('pt-BR')}
          />
          <DetailItem
            label="Validade"
            value={
              quote.validUntil
                ? new Date(quote.validUntil).toLocaleDateString('pt-BR')
                : '-'
            }
          />
          <DetailItem label="Total" value={formatCurrency(quote.total)} />
        </dl>
      </section>

      {quote.status === 'APPROVED' && (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
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
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">Observações</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {quote.notes}
          </p>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Itens do orçamento
          </h2>
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

        <div className="flex justify-end border-t border-slate-200 p-6">
          <div className="w-full max-w-sm space-y-2 text-sm">
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

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-slate-900">{value}</dd>
    </div>
  )
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
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className={strong ? 'text-base font-semibold text-slate-950' : 'text-slate-700'}>
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
