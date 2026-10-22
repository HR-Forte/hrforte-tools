import { DefaultError, QueryKey, useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useTopLoader } from 'nextjs-toploader';
import { useEffect } from 'react';

type UseCustomQueryProps<
  TData = unknown,
  TError = DefaultError,
  TQueryKey extends QueryKey = readonly unknown[],
> = UseQueryOptions<TData, TError, TData, TQueryKey> & { topBarLoading?: boolean };

export const useCustomQuery = <
  TData = unknown,
  TError = DefaultError,
  TQueryKey extends QueryKey = readonly unknown[],
>({
  topBarLoading = false,
  ...options
}: UseCustomQueryProps<TData, TError, TQueryKey>) => {
  const loader = useTopLoader();

  const query = useQuery({
    ...options,
  });

  useEffect(() => {
    if (topBarLoading && query.isFetching) {
      loader.start();
      loader.inc(loader.trickle());
    } else if (topBarLoading && !query.isFetching) {
      loader.done();
    }
  }, [query.isFetching, topBarLoading, loader]);

  return query;
};
