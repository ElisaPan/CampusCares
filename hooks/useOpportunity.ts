import { getMultiOpp, getOpportunity } from '@/api';
import { auth } from '@/firebase-config';
import { useUserStore } from '@/hooks/useUserStore';
import type { MultiOpp, Opportunity } from '@/types';
import { isOpportunity } from '@/utils/isOpp';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

function parseId(raw?: string | string[]): number | null {
  const v = Array.isArray(raw) ? raw[0] : raw;
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export function useOpportunity(rawId?: string | string[]) {
  const id = parseId(rawId);
  const allOpps = useUserStore((s) => s.allOpps);

  const fromStore = useMemo(
    () => (id == null ? undefined : allOpps.filter(isOpportunity).find((o: any) => o.id === id)),
    [allOpps, id]
  );

  const q = useQuery({
    queryKey: ['opportunity', id],
    queryFn: async () => {
      await auth.authStateReady();
      return getOpportunity(id!);
    },
    enabled: id != null && !fromStore,
    retry: 1,
    staleTime: 60_000,
  });

  const data = (fromStore ?? q.data) as Opportunity | undefined;
  return {
    data,
    isLoading: id != null && !data && !q.isError,
    isError: id == null || q.isError,
    error: q.error,
  };
}

export function useMultiOpp(rawId?: string | string[]) {
  const id = parseId(rawId);
  const allOpps = useUserStore((s) => s.allOpps);

  const fromStore = useMemo(
    () => (id == null ? undefined : allOpps.filter((o: any) => !isOpportunity(o)).find((o: any) => o.id === id)),
    [allOpps, id]
  );

  const q = useQuery({
    queryKey: ['multiopp', id],
    queryFn: async () => {
      await auth.authStateReady();
      return getMultiOpp(id!);
    },
    enabled: id != null && !fromStore,
    retry: 1,
    staleTime: 60_000,
  });

  const data = (fromStore ?? q.data) as MultiOpp | undefined;
  return {
    data,
    isLoading: id != null && !data && !q.isError,
    isError: id == null || q.isError,
    error: q.error,
  };
}