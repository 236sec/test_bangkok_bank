import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ErrorProvider } from './ErrorContext';
import { useError } from './useError';

function TestConsumer() {
  const { error, showError, clearError } = useError();
  return (
    <div>
      <span data-testid="error">{error}</span>
      <button onClick={() => showError('Something went wrong')}>
        Trigger error
      </button>
      <button onClick={clearError}>Clear error</button>
    </div>
  );
}

describe('ErrorContext', () => {
  it('starts with no error', () => {
    render(
      <ErrorProvider>
        <TestConsumer />
      </ErrorProvider>,
    );

    expect(screen.getByTestId('error')).toHaveTextContent('');
  });

  it('shows an error message', () => {
    render(
      <ErrorProvider>
        <TestConsumer />
      </ErrorProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Trigger error' }));

    expect(screen.getByTestId('error')).toHaveTextContent(
      'Something went wrong',
    );
  });

  it('clears the error', () => {
    render(
      <ErrorProvider>
        <TestConsumer />
      </ErrorProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Trigger error' }));
    expect(screen.getByTestId('error')).toHaveTextContent(
      'Something went wrong',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Clear error' }));
    expect(screen.getByTestId('error')).toHaveTextContent('');
  });

  it('throws when useError is used outside ErrorProvider', () => {
    // Suppress console.error for the expected throw
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<TestConsumer />)).toThrow(
      'useError must be used within an ErrorProvider',
    );

    spy.mockRestore();
  });
});
