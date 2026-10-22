import { useState, useEffect, useMemo, useCallback } from 'react';
import type { StoredCreatedPr } from '../_types';
import { STORAGE_KEY_CREATED_PRS } from '../_types';

export function useCreatedPrs() {
  const [createdPrs, setCreatedPrs] = useState<StoredCreatedPr[]>([]);
  const [activePrId, setActivePrId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY_CREATED_PRS);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredCreatedPr[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCreatedPrs(parsed);
          setActivePrId(`${parsed[0].repoFullName}-${parsed[0].pr.number}`);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const activePr = useMemo(() => {
    if (!activePrId) return createdPrs[0] ?? null;
    return createdPrs.find(p => `${p.repoFullName}-${p.pr.number}` === activePrId) ?? createdPrs[0] ?? null;
  }, [createdPrs, activePrId]);

  const [activeOwner, activeRepoName] = useMemo(() => {
    if (!activePr) return ['', ''];
    const parts = activePr.repoFullName.split('/');
    return [parts[0] ?? '', parts[1] ?? ''];
  }, [activePr]);

  const addCreatedPr = useCallback((entry: StoredCreatedPr) => {
    setCreatedPrs(prev => {
      const next = [entry, ...prev].slice(0, 50);
      try {
        sessionStorage.setItem(STORAGE_KEY_CREATED_PRS, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    setActivePrId(`${entry.repoFullName}-${entry.pr.number}`);
  }, []);

  const clearAll = useCallback(() => {
    setCreatedPrs([]);
    setActivePrId(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY_CREATED_PRS);
    } catch {
      // ignore
    }
  }, []);

  return {
    createdPrs,
    activePr,
    activePrId,
    activeOwner,
    activeRepoName,
    setActivePrId,
    addCreatedPr,
    clearAll,
  };
}
