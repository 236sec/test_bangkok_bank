import { useCallback, useState, type ReactNode } from 'react';
import { ErrorContext } from './useError';

export function ErrorProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState<string | null>(null);

  const showError = useCallback((message: string) => {
    setError(message);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <ErrorContext.Provider value={{ error, showError, clearError }}>
      {children}
    </ErrorContext.Provider>
  );
}
