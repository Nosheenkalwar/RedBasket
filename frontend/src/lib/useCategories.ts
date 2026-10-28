import { useEffect, useState } from 'react';
import { api } from './api';
import type { CategoryNode } from './types';

// loaded once and shared by the header, filters and pages
let cache: Promise<CategoryNode[]> | null = null;

export function useCategories() {
  const [cats, setCats] = useState<CategoryNode[]>([]);
  useEffect(() => {
    cache ??= api<CategoryNode[]>('/categories').catch((e) => {
      cache = null;
      throw e;
    });
    cache.then(setCats).catch(() => setCats([]));
  }, []);
  return cats;
}
