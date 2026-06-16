import { useCallback, useEffect, useState } from 'react'
import { apiClient } from '../lib/api'

interface UseResourceResult<T> {
  data: T[]
  loading: boolean
  error: string | null
  refetch: () => void
}

/**
 * Generic hook that GETs a list resource from the API.
 * Pass `null` as the path to skip fetching.
 */
export function useResource<T>(path: string | null): UseResourceResult<T> {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState<boolean>(path !== null)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (path === null) {
      setData([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient.get<T[]>(path)
      setData(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erreur lors du chargement'
      setError(message)
      setData([])
    } finally {
      setLoading(false)
    }
  }, [path])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

interface UseResourceItemResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void
}

/**
 * Generic hook that GETs a single resource item from the API.
 * Pass `null` as the path to skip fetching.
 */
export function useResourceItem<T>(path: string | null): UseResourceItemResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState<boolean>(path !== null)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (path === null) {
      setData(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient.get<T>(path)
      setData(res.data)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erreur lors du chargement'
      setError(message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [path])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}
