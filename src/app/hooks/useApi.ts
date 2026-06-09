/**
 * Custom hook for API calls with loading and error states
 */
import { useState, useEffect, useCallback } from 'react';
import type { APIResponse } from '../utils/api';

interface UseApiOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: any[]) => Promise<void>;
  reset: () => void;
}

export function useApi<T>(
  apiFunc: (...args: any[]) => Promise<APIResponse<T>>,
  options: UseApiOptions = {}
): UseApiReturn<T> {
  const { immediate = false, onSuccess, onError } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (...args: any[]) => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiFunc(...args);

        if (response.success && response.data) {
          setData(response.data);
          onSuccess?.(response.data);
        } else {
          const errorMessage = response.error?.message || 'An error occurred';
          setError(errorMessage);
          onError?.(response.error);
        }
      } catch (err: any) {
        const errorMessage = err.message || 'An unexpected error occurred';
        setError(errorMessage);
        onError?.(err);
      } finally {
        setLoading(false);
      }
    },
    [apiFunc, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (immediate) {
      void execute();
    }
  }, [immediate, execute]);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
}
