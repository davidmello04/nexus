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
      className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[1.2fr_1fr_auto]"
    >
      <div>
        <label className="text-sm font-medium text-slate-700">Imagem</label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null)
            setFileError('')
          }}
          className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-950"
        />
        {fileError && <p className="mt-1 text-xs text-red-600">{fileError}</p>}
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">Alt</label>
        <input
          value={alt}
          onChange={(event) => setAlt(event.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-950"
          placeholder="Descrição da imagem"
        />
      </div>

      <div className="flex flex-col justify-end gap-3">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={isMain}
            onChange={(event) => setIsMain(event.target.checked)}
            className="h-4 w-4"
          />
          Principal
        </label>

        <button
          type="submit"
          disabled={uploadMutation.isPending}
          className="cursor-pointer rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
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
