type CurrencyInputProps = {
  value?: unknown
  onChange: (value: number | undefined) => void
  placeholder?: string
  disabled?: boolean
  id?: string
  name?: string
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export function CurrencyInput({
  value,
  onChange,
  placeholder,
  disabled,
  id,
  name,
}: CurrencyInputProps) {
  const displayValue = formatDisplayValue(value)

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const digits = event.target.value.replace(/\D/g, '')

    if (!digits) {
      onChange(undefined)
      return
    }

    onChange(Number(digits) / 100)
  }

  return (
    <input
      id={id}
      name={name}
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-950 disabled:cursor-not-allowed disabled:bg-slate-100"
    />
  )
}

function formatDisplayValue(value: unknown) {
  if (value === '' || value === null || value === undefined) {
    return ''
  }

  const numericValue = Number(value)

  if (Number.isNaN(numericValue)) {
    return ''
  }

  return currencyFormatter.format(numericValue)
}
import type { ChangeEvent } from 'react'
