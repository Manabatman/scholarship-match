import { useEffect, useState } from "react";

/**
 * Debounce a value. Returns the value after delay ms of no changes.
 * @param value - The value to debounce
 * @param delay - Delay in ms (default 300)
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
