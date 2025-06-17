// src/hooks/useLocalStorage.ts
"use client";

import { useState, useEffect, useCallback } from 'react';

type SetValue<T> = (value: T | ((val: T) => T)) => void;

function useLocalStorage<T>(key: string, initialValue: T): [T, SetValue<T>] {
  // Initialize state with initialValue. This ensures server and initial client render match.
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Effect to read from localStorage on the client after hydration
  useEffect(() => {
    // This effect runs only on the client, after the initial render.
    if (typeof window !== 'undefined') {
      try {
        const item = window.localStorage.getItem(key);
        if (item !== null) { // Ensure item is not null before parsing
          setStoredValue(JSON.parse(item) as T);
        }
        // If item is null, storedValue remains initialValue, which is correct.
      } catch (error) {
        console.warn(`Error reading localStorage key “${key}”:`, error);
        // In case of error, storedValue remains initialValue.
      }
    }
  }, [key]); // Only re-run if the key changes.

  const setValue: SetValue<T> = useCallback(
    (value) => {
      // Prevent build error "window is undefined" but keep working
      if (typeof window === 'undefined') {
        console.warn(
          `Tried setting localStorage key “${key}” even though environment is not a client`
        );
        // Do not update state on server side for setValue
        return;
      }

      try {
        // Allow value to be a function so we have the same API as useState
        const newValue = value instanceof Function ? value(storedValue) : value;
        // Save to local storage
        window.localStorage.setItem(key, JSON.stringify(newValue));
        // Save state
        setStoredValue(newValue);
      } catch (error)
 {
        console.warn(`Error setting localStorage key “${key}”:`, error);
      }
    },
    [key, storedValue] // Include storedValue in the dependency array for setValue
  );

  return [storedValue, setValue];
}

export default useLocalStorage;
