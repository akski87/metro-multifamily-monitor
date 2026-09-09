import { useEffect, useState } from "react";

const KEY = "metro-mm-watchlist";

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function useWatchlist() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(read());
  }, []);

  function persist(next: string[]) {
    setIds(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  function toggle(id: string) {
    persist(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
  }

  return {
    ids,
    has: (id: string) => ids.includes(id),
    toggle,
  };
}
