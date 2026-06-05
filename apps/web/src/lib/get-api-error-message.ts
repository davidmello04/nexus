import { isAxiosError } from 'axios'

type ApiErrorResponse = {
  message?: string | string[]
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError<ApiErrorResponse>(error)) {
    const message = error.response?.data?.message

    if (Array.isArray(message)) {
      return message.join(', ')
    }

    if (typeof message === 'string' && message.trim().length > 0) {
      return message
    }
  }

  return fallback
}
