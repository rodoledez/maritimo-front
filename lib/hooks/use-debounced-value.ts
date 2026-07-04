"use client";

import { useEffect, useState } from "react";

/**
 * Devuelve una copia de `value` que sólo se actualiza tras `delayMs` sin
 * cambios. Útil para no disparar una consulta server-side en cada tecla.
 */
export function useDebouncedValue<T>(value: T, delayMs = 350): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
