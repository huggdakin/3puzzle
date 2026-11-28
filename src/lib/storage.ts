import { useEffect, useState } from "react";

export function usePersistentState<T extends object>(key: string, initialValue: T) {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<T> | null;
        if (parsed && typeof parsed === "object") {
          return { ...initialValue, ...(parsed as T) };
        }
      }
    } catch {
      // приватный режим или повреждённые данные — стартуем с чистого сохранения
    }
    return initialValue;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // сохранение недоступно — игра продолжает работать в памяти
    }
  }, [key, state]);

  return [state, setState] as const;
}

export function resetPersistentState(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}
