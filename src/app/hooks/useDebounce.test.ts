import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from './useDebounce';

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

describe('useDebounce', () => {
  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 300));
    expect(result.current).toBe('hello');
  });

  it('does not update before the delay elapses', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'updated' });
    act(() => { vi.advanceTimersByTime(100); });

    expect(result.current).toBe('initial');
  });

  it('updates after the delay elapses', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'updated' });
    act(() => { vi.advanceTimersByTime(300); });

    expect(result.current).toBe('updated');
  });

  it('resets the timer on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'a' } }
    );

    rerender({ value: 'b' });
    act(() => { vi.advanceTimersByTime(100); });
    rerender({ value: 'c' });
    act(() => { vi.advanceTimersByTime(100); });
    rerender({ value: 'd' });
    // Total elapsed: 200ms — not enough for any single 300ms window to close
    expect(result.current).toBe('a');

    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current).toBe('d');
  });

  it('uses 500ms default delay when none is provided', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      { initialProps: { value: 'first' } }
    );

    rerender({ value: 'second' });
    act(() => { vi.advanceTimersByTime(499); });
    expect(result.current).toBe('first');

    act(() => { vi.advanceTimersByTime(1); });
    expect(result.current).toBe('second');
  });

  it('works with non-string types', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 100),
      { initialProps: { value: 0 } }
    );

    rerender({ value: 42 });
    act(() => { vi.advanceTimersByTime(100); });
    expect(result.current).toBe(42);
  });
});
