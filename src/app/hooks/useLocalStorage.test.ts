// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from './useLocalStorage';

// Provide a consistent in-memory localStorage for all tests in this file
const mockStore: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => mockStore[key] ?? null,
  setItem: (key: string, val: string) => { mockStore[key] = val; },
  removeItem: (key: string) => { delete mockStore[key]; },
  clear: () => { Object.keys(mockStore).forEach((k) => delete mockStore[k]); },
  key: (i: number) => Object.keys(mockStore)[i] ?? null,
  get length() { return Object.keys(mockStore).length; },
};
vi.stubGlobal('localStorage', mockLocalStorage);

const ls = () => mockLocalStorage;

beforeEach(() => {
  ls().clear();
});

describe('useLocalStorage', () => {
  it('returns the initial value when key is not set', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('persists a value to localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('greeting', ''));

    act(() => { result.current[1]('Hello Nairobi'); });

    expect(result.current[0]).toBe('Hello Nairobi');
    expect(ls().getItem('greeting')).toBe('"Hello Nairobi"');
  });

  it('reads an existing value from localStorage on mount', () => {
    ls().setItem('city', JSON.stringify('Nairobi'));
    const { result } = renderHook(() => useLocalStorage('city', 'Unknown'));
    expect(result.current[0]).toBe('Nairobi');
  });

  it('supports functional updates', () => {
    const { result } = renderHook(() => useLocalStorage('count', 0));

    act(() => { result.current[1]((prev) => prev + 1); });
    act(() => { result.current[1]((prev) => prev + 1); });

    expect(result.current[0]).toBe(2);
  });

  it('removeValue() resets to initial value and clears localStorage', () => {
    ls().setItem('theme', JSON.stringify('dark'));
    const { result } = renderHook(() => useLocalStorage('theme', 'light'));

    act(() => { result.current[2](); });

    expect(result.current[0]).toBe('light');
    expect(ls().getItem('theme')).toBeNull();
  });

  it('handles objects and arrays correctly', () => {
    const initial = { name: '', score: 0 };
    const { result } = renderHook(() => useLocalStorage('profile', initial));

    act(() => { result.current[1]({ name: 'Koboko', score: 100 }); });

    expect(result.current[0]).toEqual({ name: 'Koboko', score: 100 });
    expect(JSON.parse(ls().getItem('profile'))).toEqual({ name: 'Koboko', score: 100 });
  });

  it('falls back to initial value when localStorage contains invalid JSON', () => {
    ls().setItem('bad-key', 'NOT_JSON');
    const { result } = renderHook(() => useLocalStorage('bad-key', 42));
    expect(result.current[0]).toBe(42);
  });
});
