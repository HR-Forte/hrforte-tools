import { DefaultError, InfiniteData, QueryKey, useInfiniteQuery, UseInfiniteQueryOptions } from '@tanstack/react-query';
import { useTopLoader } from 'nextjs-toploader';
import { useEffect } from 'react';

type UseCustomInfiniteQueryProps<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & {
  topBarLoading?: boolean;
};

export const useCustomInfiniteQuery = <
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>({
  topBarLoading = false,
  ...options
}: UseCustomInfiniteQueryProps<TQueryFnData, TError, TData, TQueryKey, TPageParam>) => {
  const loader = useTopLoader();

  const query = useInfiniteQuery({
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

export default useCustomInfiniteQuery;
