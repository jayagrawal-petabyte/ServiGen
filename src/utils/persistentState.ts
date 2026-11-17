import { useState, useEffect } from 'react';

export function getPersistentData<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item !== null && item !== undefined) {
      return JSON.parse(item);
    }
  } catch (err) {
    console.warn(`Failed to read "${key}" from localStorage:`, err);
  }
  return defaultValue;
}

export function setPersistentData<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Failed to persist "${key}" to localStorage:`, err);
  }
}

export function usePersistentState<T>(
  key: string,
  initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => getPersistentData<T>(key, initialValue));

  useEffect(() => {
    setPersistentData(key, state);
  }, [key, state]);

  return [state, setState];
}
