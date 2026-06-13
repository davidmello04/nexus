import { useState } from 'react'
import { Eye, FileSignature, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Modal } from '@/components/Modal'
import { PageHeader } from '@/components/PageHeader'
import { TablePagination } from '@/components/TablePagination'
import { usePagination } from '@/hooks/usePagination'
import { formatCurrency } from '@/lib/formatters'
import { getApiErrorMessage } from '@/lib/get-api-error-message'
import { QuoteForm } from './QuoteForm'
import type { QuoteFormData } from './quote-schema'
import { createQuote, deleteQuote, getQuotes } from './quotes-service'
import type { Quote } from './types'

export function QuotesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: quotes = [], isLoading, isError } = useQuery({
    queryKey: ['quotes'],
    queryFn: getQuotes,
  })
  const quotesPagination = usePagination({ items: quotes })
  const createQuoteMutation = useMutation({
    mutationFn: createQuote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
      setIsFormOpen(false)
    },
  })
  const deleteQuoteMutation = useMutation({
    mutationFn: deleteQuote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
      setQuoteToDelete(null)
    },
  })

  function handleCreateQuote(data: QuoteFormData) {
    createQuoteMutation.mutate(data)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orçamentos"
        description="Crie propostas, acompanhe aprovações e converta em pedidos."
        eyebrow="Pré-venda"
        icon={FileSignature}
        actions={
          <button
            type="button"
            onClick={() => {
              createQuoteMutation.reset()
              setIsFormOpen(true)
            }}
            className="cursor-pointer rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-slate-900/20 transition hover:bg-slate-800"
          >
            Novo orçamento
          </button>
        }
      />

      <div className="overflow-hidden rounded-2xl border border-white/80 bg-white shadow-sm shadow-slate-200/70 ring-1 ring-slate-900/5">
        {isLoading && (
          <div className="p-6 text-sm text-slate-500">
            Carregando orçamentos...
          </div>
        )}

        {isError && (
          <div className="p-6 text-sm text-red-600">
            Não foi possível carregar os orçamentos.
          </div>
        )}

        {!isLoading && !isError && quotes.length === 0 && (
          <div className="p-6 text-sm text-slate-500">
            Nenhum orçamento cadastrado ainda.
          </div>
        )}

        {!isLoading && !isError && quotes.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="px-4 py-3 font-medium">Código</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Validade</th>
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {quotesPagination.paginatedItems.map((quote) => (
                  <tr
                    key={quote.id}
                    data-status={quote.status}
                    onClick={() => navigate(`/quotes/${quote.id}`)}
                    className="cursor-pointer border-b border-slate-100 transition hover:bg-blue-50/45 last:border-0"
                  >
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-bold text-blue-800">
                        #{quote.code}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {quote.customer?.name || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={quote.status} />
                    </td>
                    <td className="px-4 py-3 text-base font-bold text-slate-950">
                      {formatCurrency(quote.total)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {quote.validUntil
                        ? new Date(quote.validUntil).toLocaleDateString('pt-BR')
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(quote.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            navigate(`/quotes/${quote.id}`)
                          }}
                          title="Ver detalhes do orçamento"
                          aria-label="Ver detalhes do orçamento"
                          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
                        >
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        </button>

                        {quote.status === 'DRAFT' && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              deleteQuoteMutation.reset()
                              setQuoteToDelete(quote)
                            }}
                            title="Excluir orçamento"
                            aria-label="Excluir orçamento"
                            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <TablePagination
              page={quotesPagination.page}
              pageSize={quotesPagination.pageSize}
              totalItems={quotes.length}
              onPageChange={quotesPagination.setPage}
              onPageSizeChange={quotesPagination.setPageSize}
            />
          </div>
        )}
      </div>

      <Modal
        open={isFormOpen}
        title="Novo orçamento"
        description="Selecione cliente e itens. Os preços serão calculados pelo backend."
        maxWidthClassName="max-w-5xl"
        onClose={() => setIsFormOpen(false)}
      >
        {createQuoteMutation.isError && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            Não foi possível salvar o orçamento.
          </div>
        )}
        <QuoteForm
          onSubmit={handleCreateQuote}
          isSubmitting={createQuoteMutation.isPending}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(quoteToDelete)}
        title="Excluir orçamento"
        description={
          quoteToDelete
            ? `Tem certeza que deseja excluir o orçamento #${quoteToDelete.code}?`
            : ''
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        isLoading={deleteQuoteMutation.isPending}
        errorMessage={
          deleteQuoteMutation.isError
            ? getApiErrorMessage(
                deleteQuoteMutation.error,
                'Não foi possível excluir este orçamento.',
              )
            : undefined
        }
        onConfirm={() => quoteToDelete && deleteQuoteMutation.mutate(quoteToDelete.id)}
        onCancel={() => setQuoteToDelete(null)}
      />
    </div>
  )
}

export function getQuoteStatusLabel(status: string) {
  const labels: Record<string, string> = {
    DRAFT: 'Rascunho',
    SENT: 'Enviado',
    APPROVED: 'Aprovado',
    REJECTED: 'Rejeitado',
    EXPIRED: 'Expirado',
  }
  return labels[status] ?? status
}

export function StatusBadge({ status }: { status: string }) {
  const classNames: Record<string, string> = {
    DRAFT: 'border border-slate-200 bg-slate-100 text-slate-700',
    SENT: 'border border-blue-200 bg-blue-50 text-blue-700',
    APPROVED: 'border border-emerald-200 bg-emerald-100 text-emerald-700',
    REJECTED: 'border border-red-200 bg-red-50 text-red-700',
    EXPIRED: 'border border-purple-200 bg-purple-50 text-purple-700',
  }

  return (
    <span
      className={[
        'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
        classNames[status] ?? 'border border-slate-200 bg-slate-100 text-slate-700',
      ].join(' ')}
    >
      {getQuoteStatusLabel(status)}
    </span>
  )
}
