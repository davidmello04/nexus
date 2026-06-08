import { useEffect, useMemo, useState } from 'react'

type UsePaginationParams<T> = {
  items: T[]
  initialPageSize?: number
}

export function usePagination<T>({
  items,
  initialPageSize = 10,
}: UsePaginationParams<T>) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize

    return items.slice(start, start + pageSize)
  }, [items, page, pageSize])

  function handlePageChange(nextPage: number) {
    setPage(Math.min(Math.max(nextPage, 1), totalPages))
  }

  function handlePageSizeChange(nextPageSize: number) {
    setPageSize(nextPageSize)
    setPage(1)
  }

  return {
    page,
    pageSize,
    totalPages,
    paginatedItems,
    setPage: handlePageChange,
    setPageSize: handlePageSizeChange,
  }
}
