import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { uploadProductImage } from './products-service'

type ProductImageUploadProps = {
  productId: string
  onSuccess: () => void
}

export function ProductImageUpload({
  productId,
  onSuccess,
}: ProductImageUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [alt, setAlt] = useState('')
  const [isMain, setIsMain] = useState(false)
  const [fileError, setFileError] = useState('')
  const [fileInputKey, setFileInputKey] = useState(0)

  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!file) {
        throw new Error('Selecione uma imagem.')
      }

      return uploadProductImage(productId, {
        file,
        alt,
        isMain,
      })
    },
    onSuccess: () => {
      setFile(null)
      setAlt('')
      setIsMain(false)
      setFileError('')
      setFileInputKey((key) => key + 1)
      onSuccess()
    },
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!file) {
      setFileError('Selecione uma imagem.')
      return
    }

    setFileError('')
    uploadMutation.mutate()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[220px_minmax(220px,1fr)_auto] md:items-start"
    >
      <div className="min-w-0">
        <label className="text-sm font-medium text-slate-700">Imagem</label>
        <label className="mt-2 flex h-10 w-full cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 md:w-auto">
          Selecionar imagem
          <input
            key={fileInputKey}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null)
              setFileError('')
            }}
            className="sr-only"
          />
        </label>

        <p className="mt-2 max-w-full truncate text-xs text-slate-500">
          {file?.name ?? 'Nenhuma imagem selecionada'}
        </p>
        {fileError && <p className="mt-1 text-xs text-red-600">{fileError}</p>}
      </div>

      <div className="min-w-0">
        <label className="text-sm font-medium text-slate-700">
          Descrição da imagem
        </label>
        <input
          value={alt}
          onChange={(event) => setAlt(event.target.value)}
          className="mt-2 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-950"
          placeholder="Descrição da imagem"
        />
      </div>

      <div className="flex flex-col gap-3 md:items-start md:pt-7">
        <label className="flex min-h-5 cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={isMain}
            onChange={(event) => setIsMain(event.target.checked)}
            className="h-4 w-4 cursor-pointer"
          />
          Principal
        </label>
        <button
          type="submit"
          disabled={uploadMutation.isPending}
          className="h-10 w-full cursor-pointer rounded-xl bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
        >
          {uploadMutation.isPending ? 'Enviando...' : 'Enviar imagem'}
        </button>
      </div>

      {uploadMutation.isError && (
        <div className="text-sm text-red-600 md:col-span-3">
          Não foi possível enviar a imagem.
        </div>
      )}
    </form>
  )
}
