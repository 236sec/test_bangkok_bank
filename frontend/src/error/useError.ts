import { createContext, useContext } from 'react';

export interface ErrorContextValue {
  error: string | null;
  showError: (message: string) => void;
  clearError: () => void;
}

export const ErrorContext = createContext<ErrorContextValue | null>(null);

export function useError(): ErrorContextValue {
  const ctx = useContext(ErrorContext);
  if (!ctx) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return ctx;
}
