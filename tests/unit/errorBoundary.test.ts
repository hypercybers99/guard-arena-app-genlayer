import { describe, it, expect, vi } from 'vitest';
import { ErrorBoundary } from '../../src/components/ErrorBoundary';

describe('ErrorBoundary State & Lifecycle Logic', () => {
  it('getDerivedStateFromError updates state on error', () => {
    const error = new Error('Test explosive crash');
    const state = ErrorBoundary.getDerivedStateFromError(error);
    expect(state.hasError).toBe(true);
    expect(state.error).toBe(error);
  });

  it('handleRetry resets error state and calls onReset callback', () => {
    const onResetMock = vi.fn();
    const boundary = new ErrorBoundary({
      children: 'child content',
      onReset: onResetMock,
    });

    // Simulate caught error state
    boundary.state = {
      hasError: true,
      error: new Error('Render fail'),
    };

    boundary.setState = vi.fn((update: any) => {
      boundary.state = { ...boundary.state, ...update };
    });

    boundary.handleRetry();

    expect(onResetMock).toHaveBeenCalledTimes(1);
    expect(boundary.setState).toHaveBeenCalledWith({
      hasError: false,
      error: null,
    });
  });

  it('renders children when state hasError is false', () => {
    const boundary = new ErrorBoundary({
      children: 'safe content',
    });
    boundary.state = {
      hasError: false,
      error: null,
    };

    const rendered = boundary.render();
    expect(rendered).toBe('safe content');
  });

  it('renders fallback alert tree when state hasError is true', () => {
    const boundary = new ErrorBoundary({
      children: 'safe content',
      fallbackMessage: 'Custom fallback error notice',
    });
    boundary.state = {
      hasError: true,
      error: new Error('Simulated failure'),
    };

    const rendered = boundary.render() as any;
    expect(rendered).toBeDefined();
    expect(rendered.props.role).toBe('alert');
    expect(rendered.props['aria-live']).toBe('assertive');
  });
});
